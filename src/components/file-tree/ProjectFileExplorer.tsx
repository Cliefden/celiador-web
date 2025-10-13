'use client';

import { useState, useEffect } from 'react';
import { SimpleFileExplorer } from './SimpleFileExplorer';
import { supabase } from '../../lib/supabase';
import { useFileRefresh } from './useFileRefresh';

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
  const [isScaffolding, setIsScaffolding] = useState(false);
  const { onFileRefresh } = useFileRefresh(projectId);

  useEffect(() => {
    fetchFiles();
    checkScaffoldingStatus();
  }, [projectId]);

  // Poll for files during scaffolding
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isScaffolding) {
      console.log('[ProjectFileExplorer] Starting progressive file polling during scaffolding');
      interval = setInterval(() => {
        fetchFiles(true); // Silent fetch during polling
        checkScaffoldingStatus();
      }, 2000); // Check every 2 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isScaffolding, projectId]);

  // Listen for file refresh events
  useEffect(() => {
    const cleanup = onFileRefresh((event) => {
      if (event.detail.projectId === projectId) {
        console.log(`[ProjectFileExplorer] Received refresh event for ${event.detail.filePath} (${event.detail.operation})`);
        fetchFiles(true); // Silent refresh
      }
    });

    return cleanup;
  }, [onFileRefresh, projectId]);

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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/files/create`, {
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
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/files/create`, {
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/files/${encodeURIComponent(filePath)}`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/files/delete-folder`, {
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

  const checkScaffoldingStatus = async () => {
    if (!projectId) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Check for active scaffold jobs
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/jobs?type=SCAFFOLD&status=PENDING,RUNNING`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const hasActiveScaffold = data.jobs && data.jobs.length > 0;
        setIsScaffolding(hasActiveScaffold);
        
        if (hasActiveScaffold) {
          console.log('[ProjectFileExplorer] Active scaffold job detected - enabling progressive file loading');
        }
      }
    } catch (error) {
      console.error('[ProjectFileExplorer] Error checking scaffolding status:', error);
    }
  };

  const fetchFiles = async (silent = false) => {
    if (!projectId) {
      console.log('[ProjectFileExplorer] No projectId provided');
      return;
    }
    
    if (!silent) {
      console.log('[ProjectFileExplorer] Fetching files for project:', projectId);
    }
    
    try {
      if (!silent) setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!silent) console.log('[ProjectFileExplorer] No session available');
        return;
      }

      if (!silent) console.log('[ProjectFileExplorer] Making API request for files...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/files/tree`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newFileCount = data.tree?.length || 0;
        const oldFileCount = files.length;
        
        if (!silent) {
          console.log('[ProjectFileExplorer] Received file tree:', newFileCount, 'files');
        } else if (newFileCount > oldFileCount) {
          console.log(`[ProjectFileExplorer] Progressive loading: ${newFileCount - oldFileCount} new files added`);
        }
        
        setFiles(data.tree || []);
      } else if (response.status === 404) {
        if (!silent) console.log('[ProjectFileExplorer] No files found (404)');
        setFiles([]);
      } else {
        if (!silent) console.error('[ProjectFileExplorer] Failed to fetch file tree:', response.status);
        setFiles([]);
      }
    } catch (error) {
      if (!silent) console.error('[ProjectFileExplorer] Error fetching files:', error);
      setFiles([]);
    } finally {
      if (!silent) {
        console.log('[ProjectFileExplorer] Finished loading files');
        setLoading(false);
      }
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
      selectedFile={selectedFile || undefined}
      projectId={projectId}
      className={className}
      isScaffolding={isScaffolding}
    />
  );
}