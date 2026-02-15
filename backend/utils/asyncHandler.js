/**
 * Wraps an async controller function and passes any error to the next middleware.
 * Eliminates the need for try/catch in route handlers.
 *
 * @param {Function} fn - Async controller function (req, res, next) => Promise
 * @returns {Function} Express middleware
 *
 * @example
 * const asyncHandler = require('../utils/asyncHandler');
 * const { NotFoundError } = require('../utils/errors');
 *
 * exports.getUser = asyncHandler(async (req, res) => {
 *   const user = await User.findByPk(req.params.id);
 *   if (!user) throw new NotFoundError('User not found');
 *   res.json(user);
 * });
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
