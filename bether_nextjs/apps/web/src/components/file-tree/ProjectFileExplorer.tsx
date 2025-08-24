'use client';

import { useState, useEffect } from 'react';
import { SimpleFileExplorer } from './SimpleFileExplorer';
import { supabase } from '../../lib/supabase';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileNode[];
}

interface ProjectFileExplorerProps {
  projectId: string;
  onFileSelect: (filePath: string) => void;
  selectedFile?: string | null;
  className?: string;
  onRefresh?: () => void;
}

export function ProjectFileExplorer({ 
  projectId, 
  onFileSelect, 
  selectedFile,
  className,
  onRefresh
}: ProjectFileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const handleFileSelect = (file: any) => {
    if (typeof file === 'string') {
      onFileSelect(file);
    } else if (file && file.path) {
      onFileSelect(file.path);
    }
  };

  const handleCreateFile = async (parentPath?: string) => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const filePath = parentPath ? `${parentPath}/${fileName}` : fileName;
      
      const response = await fetch(`http://localhost:4000/projects/${projectId}/files/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          filePath: filePath,
          content: '',
          type: 'file'
        }),
      });

      if (response.ok) {
        // Refresh file tree
        fetchFiles();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  const handleCreateFolder = async (parentPath?: string) => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const folderPath = parentPath ? `${parentPath}/${folderName}` : folderName;
      
      const response = await fetch(`http://localhost:4000/projects/${projectId}/files/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          filePath: folderPath,
          type: 'directory'
        }),
      });

      if (response.ok) {
        // Refresh file tree
        fetchFiles();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:4000/projects/${projectId}/files/${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        // Refresh file tree
        fetchFiles();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleDeleteFolder = async (folderPath: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Delete the folder by deleting all files in it (Supabase doesn't have folder concept)
      const response = await fetch(`http://localhost:4000/projects/${projectId}/files/delete-folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          folderPath: folderPath
        }),
      });

      if (response.ok) {
        // Refresh file tree
        fetchFiles();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
    }
  };

  const fetchFiles = async () => {
    if (!projectId) {
      console.log('[ProjectFileExplorer] No projectId provided');
      return;
    }
    
    console.log('[ProjectFileExplorer] Fetching files for project:', projectId);
    
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[ProjectFileExplorer] No session available');
        return;
      }

      console.log('[ProjectFileExplorer] Making API request for files...');
      const response = await fetch(`http://localhost:4000/projects/${projectId}/files/tree`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[ProjectFileExplorer] Received file tree:', data.tree?.length || 0, 'files');
        setFiles(data.tree || []);
      } else if (response.status === 404) {
        console.log('[ProjectFileExplorer] No files found (404)');
        setFiles([]);
      } else {
        console.error('[ProjectFileExplorer] Failed to fetch file tree:', response.status);
        setFiles([]);
      }
    } catch (error) {
      console.error('[ProjectFileExplorer] Error fetching files:', error);
      setFiles([]);
    } finally {
      console.log('[ProjectFileExplorer] Finished loading files');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SimpleFileExplorer
      files={files}
      onFileSelect={handleFileSelect}
      onCreateFile={handleCreateFile}
      onCreateFolder={handleCreateFolder}
      onDeleteFile={handleDeleteFile}
      onDeleteFolder={handleDeleteFolder}
      selectedFile={selectedFile}
      projectId={projectId}
      className={className}
    />
  );
}