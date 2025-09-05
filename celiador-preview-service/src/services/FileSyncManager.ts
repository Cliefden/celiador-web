import { promises as fs } from 'fs';
import path from 'path';
import { FileStorageService, FileData, FileTreeItem } from '../types/storage.js';
import { spawn, ChildProcess } from 'child_process';

export interface ProjectSyncConfig {
  projectId: string;
  userId: string;
  localPath: string;
  autoSync?: boolean;
}

export interface SyncResult {
  success: boolean;
  filesDownloaded: number;
  errors: string[];
  localPath: string;
}

export class FileSyncManager {
  private storageService: FileStorageService | null = null;
  private syncedProjects = new Map<string, ProjectSyncConfig>();
  private readonly baseDirectory: string;

  constructor(baseDirectory = '/tmp/celiador-previews') {
    this.baseDirectory = baseDirectory;
  }

  /**
   * Lazy initialize the storage service
   */
  private getStorageService(): FileStorageService {
    if (!this.storageService) {
      this.storageService = new FileStorageService();
    }
    return this.storageService;
  }

  /**
   * Sync project files from Supabase Storage to local directory
   */
  async syncProjectToLocal(
    projectId: string, 
    userId: string,
    options: { autoInstallDeps?: boolean; cleanFirst?: boolean } = {}
  ): Promise<SyncResult> {
    const { autoInstallDeps = true, cleanFirst = false } = options;
    
    console.log(`[FileSyncManager] Syncing project ${projectId} for user ${userId}`);
    
    const localPath = path.join(this.baseDirectory, `${userId}-${projectId}`);
    const errors: string[] = [];
    let filesDownloaded = 0;

    try {
      // Clean existing directory if requested
      if (cleanFirst) {
        await this.cleanDirectory(localPath);
      }

      // Ensure base directory exists
      await fs.mkdir(localPath, { recursive: true });

      // Get all project files from Supabase Storage
      console.log(`[FileSyncManager] Downloading project files from Supabase Storage...`);
      const files = await this.getStorageService().downloadProjectFiles(projectId, userId);
      
      console.log(`[FileSyncManager] Found ${files.length} files to download`);

      // Write all files to local directory
      for (const file of files) {
        try {
          await this.writeFileToLocal(localPath, file);
          filesDownloaded++;
        } catch (error) {
          const errorMsg = `Failed to write file ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`[FileSyncManager] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      // Auto-install dependencies if package.json exists
      if (autoInstallDeps && await this.hasPackageJson(localPath)) {
        console.log(`[FileSyncManager] Installing dependencies for project ${projectId}...`);
        try {
          await this.installDependencies(localPath);
          console.log(`[FileSyncManager] Dependencies installed successfully`);
        } catch (error) {
          const errorMsg = `Failed to install dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`[FileSyncManager] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      // Register synced project
      this.syncedProjects.set(projectId, {
        projectId,
        userId,
        localPath,
        autoSync: true
      });

      console.log(`[FileSyncManager] Sync completed for project ${projectId}. Files: ${filesDownloaded}, Errors: ${errors.length}`);

      return {
        success: errors.length === 0,
        filesDownloaded,
        errors,
        localPath
      };
    } catch (error) {
      const errorMsg = `Failed to sync project ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[FileSyncManager] ${errorMsg}`);
      errors.push(errorMsg);

      return {
        success: false,
        filesDownloaded,
        errors,
        localPath
      };
    }
  }

  /**
   * Upload local project changes back to Supabase Storage
   */
  async syncProjectToRemote(projectId: string, userId: string): Promise<SyncResult> {
    console.log(`[FileSyncManager] Syncing local changes to remote for project ${projectId}`);
    
    const config = this.syncedProjects.get(projectId);
    if (!config) {
      throw new Error(`Project ${projectId} is not currently synced locally`);
    }

    const errors: string[] = [];
    let filesUploaded = 0;

    try {
      // Read all local files
      const localFiles = await this.readLocalFiles(config.localPath);
      
      console.log(`[FileSyncManager] Found ${localFiles.length} local files to sync`);

      // Upload each file to Supabase Storage
      for (const file of localFiles) {
        try {
          await this.getStorageService().saveFile(projectId, userId, file.path, file.content.toString());
          filesUploaded++;
        } catch (error) {
          const errorMsg = `Failed to upload file ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`[FileSyncManager] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`[FileSyncManager] Remote sync completed. Files uploaded: ${filesUploaded}, Errors: ${errors.length}`);

      return {
        success: errors.length === 0,
        filesDownloaded: filesUploaded, // Reusing the field name
        errors,
        localPath: config.localPath
      };
    } catch (error) {
      const errorMsg = `Failed to sync project ${projectId} to remote: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[FileSyncManager] ${errorMsg}`);
      errors.push(errorMsg);

      return {
        success: false,
        filesDownloaded: 0,
        errors,
        localPath: config.localPath
      };
    }
  }

  /**
   * Get local path for a synced project
   */
  getLocalPath(projectId: string): string | null {
    const config = this.syncedProjects.get(projectId);
    return config?.localPath || null;
  }

  /**
   * Check if project is synced locally
   */
  isProjectSynced(projectId: string): boolean {
    return this.syncedProjects.has(projectId);
  }

  /**
   * Remove local project files and unregister sync
   */
  async removeProjectSync(projectId: string): Promise<void> {
    const config = this.syncedProjects.get(projectId);
    if (!config) {
      return;
    }

    try {
      await this.cleanDirectory(config.localPath);
      this.syncedProjects.delete(projectId);
      console.log(`[FileSyncManager] Removed local sync for project ${projectId}`);
    } catch (error) {
      console.error(`[FileSyncManager] Failed to remove project sync for ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get all synced projects
   */
  getSyncedProjects(): ProjectSyncConfig[] {
    return Array.from(this.syncedProjects.values());
  }

  /**
   * Write a file to local directory, creating necessary subdirectories
   */
  private async writeFileToLocal(basePath: string, file: FileData): Promise<void> {
    const fullPath = path.join(basePath, file.path);
    const directory = path.dirname(fullPath);

    // Create directory structure
    await fs.mkdir(directory, { recursive: true });

    // Write file content
    if (typeof file.content === 'string') {
      await fs.writeFile(fullPath, file.content, 'utf8');
    } else {
      await fs.writeFile(fullPath, file.content);
    }

    console.log(`[FileSyncManager] Wrote file: ${file.path}`);
  }

  /**
   * Read all files from local directory recursively
   */
  private async readLocalFiles(basePath: string, relativePath = ''): Promise<FileData[]> {
    const files: FileData[] = [];
    const currentPath = path.join(basePath, relativePath);

    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(relativePath, entry.name);
        const fullPath = path.join(basePath, entryPath);

        // Skip node_modules, .git, and other common build/cache directories
        if (this.shouldSkipPath(entry.name)) {
          continue;
        }

        if (entry.isDirectory()) {
          const childFiles = await this.readLocalFiles(basePath, entryPath);
          files.push(...childFiles);
        } else if (entry.isFile()) {
          const content = await fs.readFile(fullPath, 'utf8');
          files.push({
            path: entryPath,
            content,
            contentType: this.getContentType(entryPath)
          });
        }
      }
    } catch (error) {
      console.error(`[FileSyncManager] Error reading directory ${currentPath}:`, error);
    }

    return files;
  }

  /**
   * Check if path should be skipped during sync
   */
  private shouldSkipPath(name: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      '.cache',
      'coverage',
      '.nyc_output',
      '.DS_Store',
      'Thumbs.db',
      '*.log',
      '.env.local',
      '.env.*.local'
    ];

    return skipPatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(name);
      }
      return name === pattern;
    });
  }

  /**
   * Clean directory by removing all contents
   */
  private async cleanDirectory(dirPath: string): Promise<void> {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
      console.log(`[FileSyncManager] Cleaned directory: ${dirPath}`);
    } catch (error) {
      // Directory might not exist, which is fine
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Check if package.json exists in directory
   */
  private async hasPackageJson(dirPath: string): Promise<boolean> {
    try {
      await fs.access(path.join(dirPath, 'package.json'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Install dependencies using npm
   */
  private async installDependencies(projectPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[FileSyncManager] Running npm install in ${projectPath}`);
      
      const npmProcess = spawn('npm', ['install'], {
        cwd: projectPath,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      npmProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      npmProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      npmProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`[FileSyncManager] npm install completed successfully`);
          resolve();
        } else {
          console.error(`[FileSyncManager] npm install failed with code ${code}`);
          console.error('STDERR:', stderr);
          reject(new Error(`npm install failed with code ${code}: ${stderr}`));
        }
      });

      npmProcess.on('error', (error) => {
        console.error(`[FileSyncManager] npm install process error:`, error);
        reject(error);
      });
    });
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.js': 'text/javascript',
      '.ts': 'text/typescript',
      '.jsx': 'text/javascript',
      '.tsx': 'text/typescript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
    };
    
    return mimeTypes[ext] || 'text/plain';
  }
}

// Singleton instance
export const fileSyncManager = new FileSyncManager();