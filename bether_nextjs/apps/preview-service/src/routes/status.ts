import { Router } from 'express';
import { portManager } from '../services/PortManager';
import { projectRunner } from '../services/ProjectRunner';

export const statusRouter = Router();

/**
 * Health check endpoint
 * GET /status/health
 */
statusRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'preview-service'
  });
});

/**
 * Service status with resource information
 * GET /status/info
 */
statusRouter.get('/info', (req, res) => {
  try {
    const allocatedPorts = portManager.getAllocatedPorts();
    const previews = projectRunner.getAllPreviews();
    
    res.json({
      success: true,
      service: 'preview-service',
      timestamp: new Date().toISOString(),
      resources: {
        allocatedPorts: allocatedPorts.length,
        availablePorts: 1000 - allocatedPorts.length, // 8000-9000 range
        activePreviews: previews.length,
        runningPreviews: previews.filter(p => p.status === 'running').length
      },
      allocatedPorts,
      previews: previews.map(p => ({
        id: p.id,
        projectId: p.projectId,
        port: p.port,
        status: p.status,
        uptime: Date.now() - p.startTime.getTime()
      }))
    });
  } catch (error) {
    console.error('[Status API] Info error:', error);
    res.status(500).json({ 
      error: 'Failed to get service info',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Cleanup stale previews
 * POST /status/cleanup
 */
statusRouter.post('/cleanup', async (req, res) => {
  try {
    await projectRunner.cleanupStalePreviews();
    
    res.json({
      success: true,
      message: 'Cleanup completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Status API] Cleanup error:', error);
    res.status(500).json({ 
      error: 'Failed to cleanup previews',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});