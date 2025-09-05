import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from local .env file
dotenv.config();

import { previewRouter } from './routes/preview';
import { statusRouter } from './routes/status';
import { projectRunner } from './services/ProjectRunner';

const app = express();
const PORT = process.env.PREVIEW_SERVICE_PORT || 4001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', // Web app
    'http://localhost:4000', // Orchestrator
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/preview', previewRouter);
app.use('/status', statusRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Celiador Preview Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      preview: '/preview',
      status: '/status'
    }
  });
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Preview Service] Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Cleanup interval (every 30 minutes)
setInterval(() => {
  projectRunner.cleanupStalePreviews().catch(console.error);
}, 30 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Preview Service] Received SIGTERM, shutting down gracefully...');
  
  // Stop all running previews
  const previews = projectRunner.getAllPreviews();
  await Promise.all(
    previews.map(preview => projectRunner.stopPreview(preview.id))
  );
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Preview Service] Received SIGINT, shutting down gracefully...');
  
  // Stop all running previews
  const previews = projectRunner.getAllPreviews();
  await Promise.all(
    previews.map(preview => projectRunner.stopPreview(preview.id))
  );
  
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`[Preview Service] Server running on port ${PORT}`);
  console.log(`[Preview Service] Health check: http://localhost:${PORT}/status/health`);
  console.log(`[Preview Service] API docs: http://localhost:${PORT}/`);
});