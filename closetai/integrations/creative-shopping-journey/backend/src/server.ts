/**
 * Creative Shopping Journey Backend Server
 * Provides REST API endpoints for creative recommendations and try-on functionality
 */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { creativeRouter } from './routes/creative';
import { creativeService } from './services/creativeService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Routes
app.use('/api/creative', creativeRouter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', mode: process.env.INTEGRATION_MODE || 'demo' });
});

// Metrics endpoint (dev only)
app.get('/admin/creative/metrics', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(creativeService.getMetrics());
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Creative Shopping Journey API running on port ${PORT}`);
  console.log(`Mode: ${process.env.INTEGRATION_MODE || 'demo'}`);
});

export default app;