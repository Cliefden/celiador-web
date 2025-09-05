import { createClient } from '@supabase/supabase-js';

export interface FileData {
  path: string;
  content: string | Buffer;
  contentType?: string;
}

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileTreeItem[];
}

export class FileStorageService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('FileStorageService: Missing environment variables');
      console.error('SUPABASE_URL present:', !!process.env.SUPABASE_URL);
      console.error('SUPABASE_SERVICE_ROLE_KEY present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      throw new Error('Supabase URL and Service Role Key are required for FileStorageService');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Upload project files to Supabase Storage
   */
  async uploadProjectFiles(projectId: string, userId: string, files: FileData[]): Promise<{ path: string; url: string }[]> {
    console.log(`[storage] Uploading ${files.length} files for project ${projectId}, user ${userId}`);
    const results = [];
    
    for (const file of files) {
      const filePath = `${userId}/${projectId}/${file.path}`;
      const contentType = file.contentType || this.getContentType(file.path);
      
      console.log(`[storage] Uploading file: ${filePath} (${contentType})`);
      
      const { data, error } = await this.supabase.storage
        .from('project-files')
        .upload(filePath, file.content, {
          contentType,
          upsert: true
        });
        
      if (error) {
        console.error(`[storage] Failed to upload ${filePath}:`, error);
        throw new Error(`Failed to upload ${file.path}: ${error.message}`);
      }
      
      console.log(`[storage] Successfully uploaded: ${filePath}`);
      results.push({ 
        path: file.path, 
        url: data.path 
      });
    }
    
    console.log(`[storage] Upload completed. ${results.length} files uploaded.`);
    return results;
  }

  /**
   * Download all project files from Supabase Storage (recursive)
   */
  async downloadProjectFiles(projectId: string, userId: string): Promise<FileData[]> {
    console.log(`[storage] Getting all files recursively for project ${projectId}, user ${userId}`);
    const basePath = `${userId}/${projectId}`;
    
    // Get all files recursively using the existing method
    const allFiles = await this.getAllFilesRecursively(basePath);
    console.log(`[storage] Found ${allFiles.length} files to download`);
    
    const files: FileData[] = [];
    
    for (const file of allFiles) {
      // Skip directories (items without id/metadata are directories)
      if (!file.id && !file.metadata) {
        console.log(`[storage] Skipping directory: ${file.fullPath || file.name}`);
        continue;
      }
      
      if (file.fullPath || file.name) {
        const filePath = file.fullPath || file.name;
        try {
          const { data: fileData, error: downloadError } = await this.supabase.storage
            .from('project-files')
            .download(`${basePath}/${filePath}`);
            
          if (downloadError) {
            console.error(`[storage] Failed to download ${filePath}:`, downloadError);
            continue;
          }
          
          const content = await fileData.text();
          files.push({
            path: filePath,
            content,
            contentType: file.metadata?.mimetype || this.getContentType(filePath)
          });
          console.log(`[storage] Downloaded: ${filePath} (${content.length} chars)`);
        } catch (error) {
          console.error(`[storage] Error downloading ${filePath}:`, error);
        }
      }
    }
    
    console.log(`[storage] Successfully downloaded ${files.length} files`);
    return files;
  }

  /**
   * Get file tree structure for a project
   */
  async getProjectFileTree(projectId: string, userId: string): Promise<FileTreeItem[]> {
    console.log(`[storage] Getting file tree for project ${projectId}, user ${userId}`);
    const basePath = `${userId}/${projectId}`;
    console.log(`[storage] Listing files from path: ${basePath}`);
    
    // Get all files recursively using the search functionality
    const allFiles = await this.getAllFilesRecursively(basePath);
    
    console.log(`[storage] All files found:`, JSON.stringify(allFiles, null, 2));
    const tree = this.buildFileTreeFromPaths(allFiles);
    console.log(`[storage] Built file tree:`, JSON.stringify(tree, null, 2));
    
    return tree;
  }

  /**
   * Get all files recursively from a path
   */
  private async getAllFilesRecursively(basePath: string, currentPath = ''): Promise<any[]> {
    const fullPath = currentPath ? `${basePath}/${currentPath}` : basePath;
    
    const { data, error } = await this.supabase.storage
      .from('project-files')
      .list(fullPath, {
        limit: 1000,
        offset: 0
      });
      
    if (error) {
      console.error(`Failed to list files at ${fullPath}:`, error);
      return [];
    }
    
    let allFiles: any[] = [];
    
    for (const item of data) {
      if (!item.name) continue;
      
      const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      
      // Add the current item with its path
      allFiles.push({
        ...item,
        fullPath: itemPath
      });
      
      // If this is a directory (no metadata means it's a folder), recursively get its contents
      if (!item.id && !item.metadata) {
        const childFiles = await this.getAllFilesRecursively(basePath, itemPath);
        allFiles.push(...childFiles);
      }
    }
    
    return allFiles;
  }

  /**
   * Delete all project files
   */
  async deleteProjectFiles(projectId: string, userId: string): Promise<void> {
    console.log(`[storage] Deleting all files for project ${projectId}, user ${userId}`);
    const { error } = await this.supabase.storage
      .from('project-files')
      .remove([`${userId}/${projectId}`]);
      
    if (error) {
      console.error('[storage] Failed to delete project files:', error);
      throw new Error(`Failed to delete project files: ${error.message}`);
    }
    
    console.log(`[storage] Successfully deleted all files for project ${projectId}`);
  }

  /**
   * Delete all project files (alias for deleteProjectFiles)
   */
  async deleteAllProjectFiles(projectId: string, userId: string): Promise<void> {
    return this.deleteProjectFiles(projectId, userId);
  }

  /**
   * Get a single file by path
   */
  async getFile(projectId: string, userId: string, filePath: string): Promise<FileData | null> {
    const { data, error } = await this.supabase.storage
      .from('project-files')
      .download(`${userId}/${projectId}/${filePath}`);
      
    if (error) {
      if (error.message.includes('not found')) {
        return null;
      }
      throw new Error(`Failed to get file ${filePath}: ${error.message}`);
    }
    
    const content = await data.text();
    return {
      path: filePath,
      content,
      contentType: this.getContentType(filePath)
    };
  }

  /**
   * Update a single file
   */
  async updateFile(projectId: string, userId: string, filePath: string, content: string): Promise<void> {
    const contentType = this.getContentType(filePath);
    
    const { error } = await this.supabase.storage
      .from('project-files')
      .upload(`${userId}/${projectId}/${filePath}`, content, {
        contentType,
        upsert: true
      });
      
    if (error) {
      throw new Error(`Failed to update file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Save a single file (alias for updateFile)
   */
  async saveFile(projectId: string, userId: string, filePath: string, content: string): Promise<void> {
    return this.updateFile(projectId, userId, filePath, content);
  }

  /**
   * Delete a single file
   */
  async deleteFile(projectId: string, userId: string, filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from('project-files')
      .remove([`${userId}/${projectId}/${filePath}`]);
      
    if (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Get public URL for a file (if bucket is public)
   */
  getPublicUrl(projectId: string, userId: string, filePath: string): string {
    const { data } = this.supabase.storage
      .from('project-files')
      .getPublicUrl(`${userId}/${projectId}/${filePath}`);
      
    return data.publicUrl;
  }

  /**
   * Build file tree from file paths
   */
  private buildFileTreeFromPaths(files: any[]): FileTreeItem[] {
    const tree: FileTreeItem[] = [];
    const fileMap = new Map<string, FileTreeItem>();
    
    // Process all files and build the tree
    for (const file of files) {
      if (!file.fullPath) continue;
      
      const pathParts = file.fullPath.split('/');
      let currentPath = '';
      
      // Build the path hierarchy
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!fileMap.has(currentPath)) {
          const isDirectory = i < pathParts.length - 1 || (!file.id && !file.metadata);
          const treeItem: FileTreeItem = {
            name: part,
            path: currentPath,
            type: isDirectory ? 'directory' : 'file',
            size: isDirectory ? undefined : file.metadata?.size,
            children: isDirectory ? [] : undefined
          };
          
          fileMap.set(currentPath, treeItem);
          
          if (parentPath && fileMap.has(parentPath)) {
            const parent = fileMap.get(parentPath)!;
            if (parent.children) {
              parent.children.push(treeItem);
            }
          } else if (!parentPath) {
            tree.push(treeItem);
          }
        }
      }
    }
    
    return tree;
  }

  /**
   * Build file tree from storage list (legacy method)
   */
   private buildFileTree(files: any[], basePath: string): FileTreeItem[] {
    const tree: FileTreeItem[] = [];
    const fileMap = new Map<string, FileTreeItem>();
    
    // First pass: create entries for actual files and identify directories
    const directoryPaths = new Set<string>();
    
    for (const file of files) {
      if (!file.name) continue;
      
      // Check if this is a directory placeholder (no metadata/id means it's a directory)
      const isDirectoryPlaceholder = !file.id && !file.metadata;
      
      if (isDirectoryPlaceholder) {
        directoryPaths.add(file.name);
        continue;
      }
      
      const pathParts = file.name.split('/');
      let currentPath = '';
      
      // Mark all parent paths as directories
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i];
        directoryPaths.add(currentPath);
      }
      
      // Process the full path
      currentPath = '';
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!fileMap.has(currentPath)) {
          const isDirectory = directoryPaths.has(currentPath) || i < pathParts.length - 1;
          const treeItem: FileTreeItem = {
            name: part,
            path: currentPath,
            type: isDirectory ? 'directory' : 'file',
            size: isDirectory ? undefined : file.metadata?.size,
            children: isDirectory ? [] : undefined
          };
          
          fileMap.set(currentPath, treeItem);
          
          if (parentPath && fileMap.has(parentPath)) {
            const parent = fileMap.get(parentPath)!;
            if (parent.children) {
              parent.children.push(treeItem);
            }
          } else if (!parentPath) {
            tree.push(treeItem);
          }
        }
      }
    }
    
    // Second pass: add directory placeholders that don't have files
    for (const dirPath of directoryPaths) {
      if (!fileMap.has(dirPath)) {
        const pathParts = dirPath.split('/');
        const name = pathParts[pathParts.length - 1];
        const parentPath = pathParts.slice(0, -1).join('/');
        
        const treeItem: FileTreeItem = {
          name,
          path: dirPath,
          type: 'directory',
          children: []
        };
        
        fileMap.set(dirPath, treeItem);
        
        if (parentPath && fileMap.has(parentPath)) {
          const parent = fileMap.get(parentPath)!;
          if (parent.children) {
            parent.children.push(treeItem);
          }
        } else if (!parentPath) {
          tree.push(treeItem);
        }
      }
    }
    
    return tree;
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'jsx': 'text/javascript',
      'tsx': 'text/typescript',
      'css': 'text/css',
      'html': 'text/html',
      'htm': 'text/html',
      'json': 'application/json',
      'xml': 'application/xml',
      'md': 'text/markdown',
      'txt': 'text/plain',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf',
      'eot': 'application/vnd.ms-fontobject'
    };
    
    return mimeTypes[ext || ''] || 'text/plain';
  }
}
