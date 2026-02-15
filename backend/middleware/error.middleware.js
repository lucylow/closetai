const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Global error handling middleware.
 * Must be registered last in the middleware stack (after all routes).
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  const isOperational = err.isOperational === true;

  // Log error with context
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id,
    statusCode,
    name: err.name,
  });

  let message = err.message || 'Internal server error';
  let details = err.details ?? null;

  // Handle specific error types
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 422;
    message = 'Database validation error';
    details = err.errors?.map((e) => ({ field: e.path, message: e.message })) ?? null;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    details = null;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    details = null;
  } else if (err.code === 'EBADCSRFTOKEN') {
    statusCode = 403;
    message = 'Invalid CSRF token';
    details = null;
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
    details = null;
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
    details = null;
  } else if (err.message === 'quota_exceeded') {
    statusCode = 402;
    message = 'Quota exceeded';
    details = null;
  } else if (err.isAxiosError) {
    statusCode = err.response?.status && err.response.status >= 400 && err.response.status < 600
      ? err.response.status
      : 502;
    message = 'External service error';
    details = {
      service: err.config?.url,
      status: err.response?.status,
      data: err.response?.data,
    };
  } else if (!(err instanceof AppError) && !isOperational) {
    // Programming or unknown error – don't leak details in production
    if (process.env.NODE_ENV === 'production') {
      message = 'Internal server error';
      details = null;
    } else {
      details = details ?? { stack: err.stack };
    }
  }

  const response = {
    success: false,
    error: {
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && err.stack && { stack: err.stack }),
    },
  };

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
