import { Router } from 'express';
import { projectRunner, ProjectConfig } from '../services/ProjectRunner';

export const previewRouter = Router();

/**
 * Start a new project preview
 * POST /preview/start
 */
previewRouter.post('/start', async (req, res) => {
  try {
    const { projectId, userId, name, type = 'nextjs', rootPath } = req.body;

    if (!projectId || !userId || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields: projectId, userId, name' 
      });
    }

    const projectConfig: ProjectConfig = {
      id: projectId,
      userId,
      name,
      type,
      rootPath: rootPath || '.'
    };

    const instance = await projectRunner.startPreview(projectConfig);

    res.json({
      success: true,
      preview: {
        id: instance.id,
        projectId: instance.projectId,
        userId: instance.userId,
        url: instance.url,
        port: instance.port,
        status: instance.status,
        localPath: instance.localPath,
        syncResult: instance.syncResult,
        startTime: instance.startTime
      }
    });
  } catch (error) {
    console.error('[Preview API] Start preview error:', error);
    res.status(500).json({ 
      error: 'Failed to start preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Stop a project preview
 * DELETE /preview/:instanceId
 */
previewRouter.delete('/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;

    await projectRunner.stopPreview(instanceId);

    res.json({
      success: true,
      message: `Preview ${instanceId} stopped`
    });
  } catch (error) {
    console.error('[Preview API] Stop preview error:', error);
    res.status(500).json({ 
      error: 'Failed to stop preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get preview status
 * GET /preview/:instanceId/status
 */
previewRouter.get('/:instanceId/status', (req, res) => {
  try {
    const { instanceId } = req.params;
    const instance = projectRunner.getPreview(instanceId);

    if (!instance) {
      return res.status(404).json({ 
        error: 'Preview instance not found' 
      });
    }

    res.json({
      success: true,
      preview: {
        id: instance.id,
        projectId: instance.projectId,
        userId: instance.userId,
        url: instance.url,
        port: instance.port,
        status: instance.status,
        localPath: instance.localPath,
        syncResult: instance.syncResult,
        startTime: instance.startTime,
        lastAccessed: instance.lastAccessed
      }
    });
  } catch (error) {
    console.error('[Preview API] Get status error:', error);
    res.status(500).json({ 
      error: 'Failed to get preview status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * List all preview instances
 * GET /preview/list
 */
previewRouter.get('/list', (req, res) => {
  try {
    const { projectId } = req.query;
    
    let instances;
    if (projectId) {
      instances = projectRunner.getPreviewsForProject(projectId as string);
    } else {
      instances = projectRunner.getAllPreviews();
    }

    res.json({
      success: true,
      previews: instances.map(instance => ({
        id: instance.id,
        projectId: instance.projectId,
        userId: instance.userId,
        url: instance.url,
        port: instance.port,
        status: instance.status,
        localPath: instance.localPath,
        startTime: instance.startTime,
        lastAccessed: instance.lastAccessed
      }))
    });
  } catch (error) {
    console.error('[Preview API] List previews error:', error);
    res.status(500).json({ 
      error: 'Failed to list previews',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Restart a preview instance
 * POST /preview/:instanceId/restart
 */
previewRouter.post('/:instanceId/restart', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const instance = projectRunner.getPreview(instanceId);

    if (!instance) {
      return res.status(404).json({ 
        error: 'Preview instance not found' 
      });
    }

    // Stop the current instance
    await projectRunner.stopPreview(instanceId);

    // Start a new instance with the same project config
    const projectConfig: ProjectConfig = {
      id: instance.projectId,
      userId: instance.userId,
      name: `Project ${instance.projectId}`,
      type: 'nextjs', // Will be auto-detected
      rootPath: '.'
    };

    const newInstance = await projectRunner.startPreview(projectConfig);

    res.json({
      success: true,
      preview: {
        id: newInstance.id,
        projectId: newInstance.projectId,
        userId: newInstance.userId,
        url: newInstance.url,
        port: newInstance.port,
        status: newInstance.status,
        localPath: newInstance.localPath,
        syncResult: newInstance.syncResult,
        startTime: newInstance.startTime
      }
    });
  } catch (error) {
    console.error('[Preview API] Restart preview error:', error);
    res.status(500).json({ 
      error: 'Failed to restart preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});