import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { portManager } from './PortManager';
import { fileSyncManager, SyncResult } from './FileSyncManager';

export interface ProjectConfig {
  id: string;
  userId: string;
  name: string;
  type: 'nextjs' | 'react' | 'vue' | 'static';
  rootPath: string;
}

export interface PreviewInstance {
  id: string;
  projectId: string;
  userId: string;
  port: number;
  url: string;
  status: 'syncing' | 'starting' | 'running' | 'error' | 'stopped';
  process?: ChildProcess;
  localPath?: string;
  syncResult?: SyncResult;
  startTime: Date;
  lastAccessed: Date;
  errorMessage?: string;
}

export class ProjectRunner {
  private instances = new Map<string, PreviewInstance>();
  private readonly basePreviewDir: string;

  constructor(basePreviewDir: string = '/tmp/celiador-previews') {
    this.basePreviewDir = basePreviewDir;
  }

  /**
   * Start a project preview
   */
  async startPreview(projectConfig: ProjectConfig): Promise<PreviewInstance> {
    const instanceId = `${projectConfig.id}-${Date.now()}`;
    const port = await portManager.allocatePort();
    
    const instance: PreviewInstance = {
      id: instanceId,
      projectId: projectConfig.id,
      userId: projectConfig.userId,
      port,
      url: `http://localhost:${port}`,
      status: 'syncing',
      startTime: new Date(),
      lastAccessed: new Date()
    };

    this.instances.set(instanceId, instance);

    try {
      console.log(`[ProjectRunner] Starting preview for ${projectConfig.name} - syncing files...`);
      
      // Sync project files from Supabase Storage to local directory
      // Only clean on first sync - check if directory already exists with recent files
      const localPath = `/tmp/celiador-previews/${projectConfig.userId}-${projectConfig.id}`;
      let shouldClean = true;
      
      try {
        const fs = await import('fs/promises');
        const stat = await fs.stat(localPath);
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        // If directory exists and was modified recently, don't clean
        if (stat.mtime.getTime() > fiveMinutesAgo) {
          shouldClean = false;
          console.log(`[ProjectRunner] Directory recently modified, preserving existing files`);
        }
      } catch {
        // Directory doesn't exist, clean sync is appropriate
      }
      
      const syncResult = await fileSyncManager.syncProjectToLocal(
        projectConfig.id, 
        projectConfig.userId,
        { autoInstallDeps: true, cleanFirst: shouldClean }
      );

      instance.syncResult = syncResult;
      instance.localPath = syncResult.localPath;

      if (!syncResult.success) {
        instance.status = 'error';
        portManager.releasePort(port);
        const errorMsg = `File sync failed: ${syncResult.errors.join(', ')}`;
        console.error(`[ProjectRunner] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log(`[ProjectRunner] Files synced successfully. Downloaded ${syncResult.filesDownloaded} files to ${syncResult.localPath}`);
      
      // Check if any files were downloaded
      if (syncResult.filesDownloaded === 0) {
        instance.status = 'error';
        instance.errorMessage = 'No project files found. Please scaffold or upload files to your project before previewing.';
        portManager.releasePort(port);
        throw new Error(instance.errorMessage);
      }
      
      // Update status and start the development server
      instance.status = 'starting';
      
      // Detect project type from synced files if not specified
      const detectedType = await this.detectProjectType(syncResult.localPath);
      const projectType = projectConfig.type || detectedType;

      console.log(`[ProjectRunner] Detected project type: ${projectType}`);

      // Start the appropriate development server
      const devProcess = await this.spawnDevServer({
        ...projectConfig,
        type: projectType
      }, syncResult.localPath, port);
      
      instance.process = devProcess;
      instance.status = 'running';

      // Setup process event handlers
      this.setupProcessHandlers(instance);

      console.log(`[ProjectRunner] Started preview for ${projectConfig.name} on port ${port}`);
      return instance;
    } catch (error) {
      instance.status = 'error';
      instance.errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      portManager.releasePort(port);
      console.error(`[ProjectRunner] Failed to start preview for ${projectConfig.name}:`, error);
      throw error;
    }
  }

  /**
   * Stop a project preview
   */
  async stopPreview(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Preview instance ${instanceId} not found`);
    }

    if (instance.process) {
      instance.process.kill('SIGTERM');
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (instance.process && !instance.process.killed) {
          instance.process.kill('SIGKILL');
        }
      }, 5000);
    }

    // Kill any remaining process on the port
    await portManager.killProcessOnPort(instance.port);
    portManager.releasePort(instance.port);

    // Clean up local project files
    if (instance.localPath) {
      try {
        await fileSyncManager.removeProjectSync(instance.projectId);
        console.log(`[ProjectRunner] Cleaned up local files for ${instanceId}`);
      } catch (error) {
        console.error(`[ProjectRunner] Failed to clean up local files for ${instanceId}:`, error);
      }
    }

    instance.status = 'stopped';
    this.instances.delete(instanceId);

    console.log(`[ProjectRunner] Stopped preview ${instanceId}`);
  }

  /**
   * Get preview instance
   */
  getPreview(instanceId: string): PreviewInstance | undefined {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.lastAccessed = new Date();
    }
    return instance;
  }

  /**
   * Get all preview instances
   */
  getAllPreviews(): PreviewInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get preview instances for a specific project
   */
  getPreviewsForProject(projectId: string): PreviewInstance[] {
    return Array.from(this.instances.values())
      .filter(instance => instance.projectId === projectId);
  }

  /**
   * Spawn development server based on project type
   */
  private async spawnDevServer(
    projectConfig: ProjectConfig, 
    projectDir: string, 
    port: number
  ): Promise<ChildProcess> {
    let command: string;
    let args: string[];

    switch (projectConfig.type) {
      case 'nextjs':
        command = 'npm';
        args = ['run', 'dev', '--', '-p', port.toString()];
        break;
      case 'react':
        command = 'npm';
        args = ['run', 'start', '--', '--port', port.toString()];
        break;
      case 'vue':
        command = 'npm';
        args = ['run', 'serve', '--', '--port', port.toString()];
        break;
      case 'static':
        command = 'npx';
        args = ['serve', '.', '-l', port.toString()];
        break;
      default:
        throw new Error(`Unsupported project type: ${projectConfig.type}`);
    }

    console.log(`[ProjectRunner] Spawning: ${command} ${args.join(' ')} in ${projectDir}`);

    const childProcess = spawn(command, args, {
      cwd: projectDir,
      env: { 
        ...process.env, 
        PORT: port.toString(),
        NODE_ENV: 'development'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    return childProcess;
  }

  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(instance: PreviewInstance): void {
    if (!instance.process) return;

    instance.process.stdout?.on('data', (data) => {
      console.log(`[Preview ${instance.id}] STDOUT: ${data}`);
    });

    instance.process.stderr?.on('data', (data) => {
      console.error(`[Preview ${instance.id}] STDERR: ${data}`);
    });

    instance.process.on('close', (code) => {
      console.log(`[Preview ${instance.id}] Process exited with code ${code}`);
      if (code === 0) {
        instance.status = 'stopped';
      } else {
        instance.status = 'error';
        instance.errorMessage = `Preview process failed with exit code ${code}. Check that your project has valid files and dependencies.`;
      }
      portManager.releasePort(instance.port);
      
      // Only delete the instance if it stopped cleanly
      // Keep failed instances around so frontend can detect errors
      if (code === 0) {
        this.instances.delete(instance.id);
      }
    });

    instance.process.on('error', (error) => {
      console.error(`[Preview ${instance.id}] Process error:`, error);
      instance.status = 'error';
      instance.errorMessage = `Process error: ${error.message}`;
      portManager.releasePort(instance.port);
    });
  }

  /**
   * Cleanup stale previews (older than 1 hour with no access)
   */
  async cleanupStalePreviews(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const instance of this.instances.values()) {
      if (instance.lastAccessed < oneHourAgo) {
        console.log(`[ProjectRunner] Cleaning up stale preview ${instance.id}`);
        await this.stopPreview(instance.id);
      }
    }
  }

  /**
   * Detect project type based on files in directory
   */
  private async detectProjectType(projectDir: string): Promise<'nextjs' | 'react' | 'vue' | 'static'> {
    try {
      // Check for Next.js
      const nextConfigExists = await this.fileExists(path.join(projectDir, 'next.config.js')) ||
                              await this.fileExists(path.join(projectDir, 'next.config.mjs')) ||
                              await this.fileExists(path.join(projectDir, 'next.config.ts'));
      
      if (nextConfigExists) {
        return 'nextjs';
      }

      // Check package.json for framework dependencies
      const packageJsonPath = path.join(projectDir, 'package.json');
      if (await this.fileExists(packageJsonPath)) {
        try {
          const packageContent = await fs.readFile(packageJsonPath, 'utf8');
          const packageJson = JSON.parse(packageContent);
          const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

          if (dependencies.next) {
            return 'nextjs';
          } else if (dependencies.vue || dependencies['@vue/cli']) {
            return 'vue';
          } else if (dependencies.react || dependencies['create-react-app']) {
            return 'react';
          }
        } catch (error) {
          console.warn(`[ProjectRunner] Failed to parse package.json: ${error}`);
        }
      }

      // Check for index.html (static site)
      if (await this.fileExists(path.join(projectDir, 'index.html'))) {
        return 'static';
      }

      // Default to static
      return 'static';
    } catch (error) {
      console.warn(`[ProjectRunner] Error detecting project type: ${error}`);
      return 'static';
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const projectRunner = new ProjectRunner();