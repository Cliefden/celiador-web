import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { portManager } from './PortManager';

export interface ProjectConfig {
  id: string;
  name: string;
  type: 'nextjs' | 'react' | 'vue' | 'static';
  rootPath: string;
}

export interface PreviewInstance {
  id: string;
  projectId: string;
  port: number;
  url: string;
  status: 'starting' | 'running' | 'error' | 'stopped';
  process?: ChildProcess;
  startTime: Date;
  lastAccessed: Date;
}

export class ProjectRunner {
  private instances = new Map<string, PreviewInstance>();
  private readonly basePreviewDir: string;

  constructor(basePreviewDir: string = '/tmp/bether-previews') {
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
      port,
      url: `http://localhost:${port}`,
      status: 'starting',
      startTime: new Date(),
      lastAccessed: new Date()
    };

    this.instances.set(instanceId, instance);

    try {
      // Ensure the project directory exists
      const projectDir = path.join(this.basePreviewDir, projectConfig.id);
      await fs.mkdir(projectDir, { recursive: true });

      // Start the appropriate development server
      const process = await this.spawnDevServer(projectConfig, projectDir, port);
      
      instance.process = process;
      instance.status = 'running';

      // Setup process event handlers
      this.setupProcessHandlers(instance);

      console.log(`[ProjectRunner] Started preview for ${projectConfig.name} on port ${port}`);
      return instance;
    } catch (error) {
      instance.status = 'error';
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

    const process = spawn(command, args, {
      cwd: projectDir,
      env: { 
        ...process.env, 
        PORT: port.toString(),
        NODE_ENV: 'development'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    return process;
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
      instance.status = code === 0 ? 'stopped' : 'error';
      portManager.releasePort(instance.port);
      this.instances.delete(instance.id);
    });

    instance.process.on('error', (error) => {
      console.error(`[Preview ${instance.id}] Process error:`, error);
      instance.status = 'error';
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
}

// Singleton instance
export const projectRunner = new ProjectRunner();