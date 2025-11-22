'use client';

import { useState, useEffect } from 'react';
import { SimpleFileExplorer } from './SimpleFileExplorer';
import { supabase } from '../../lib/supabase';
import { useFileRefresh } from './useFileRefresh';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';

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
  const { session } = useAuth();
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const { onFileRefresh } = useFileRefresh(projectId);

  // Helper function to get valid session with automatic refresh
  const getValidSession = async () => {
    let { data: { session }, error } = await supabase.auth.getSession();
    
    
    // Check if session is expired or invalid
    const now = Math.floor(Date.now() / 1000);
    const isExpired = session?.expires_at && session.expires_at < now;
    
    if (!session || error || isExpired) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        return null;
      }
      
      session = refreshData.session;
    }
    
    return session;
  };

  useEffect(() => {
    if (projectId) {
      fetchFiles();
      checkScaffoldingStatus();
    }
  }, [projectId]);

  // Poll for files during scaffolding
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isScaffolding) {
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
      setOperationLoading(`Creating file: ${fileName}`);
      setError(null);

      // Get valid session with automatic refresh
      const validSession = await getValidSession();
      if (!validSession) {
        setError('Session expired. Please refresh the page to sign in again.');
        return;
      }

      const filePath = parentPath ? `${parentPath}/${fileName}` : fileName;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/files/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validSession.access_token}`,
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
      } else {
        const errorText = await response.text();
        setError(`Failed to create file: ${response.status} ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating file:', error);
      setError(`Failed to create file: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleCreateFolder = async (parentPath?: string) => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      setOperationLoading(`Creating folder: ${folderName}`);
      setError(null);

      // Get valid session with automatic refresh
      const validSession = await getValidSession();
      if (!validSession) {
        setError('Session expired. Please refresh the page to sign in again.');
        return;
      }

      const folderPath = parentPath ? `${parentPath}/${folderName}` : folderName;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/files/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validSession.access_token}`,
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
      } else {
        const errorText = await response.text();
        setError(`Failed to create folder: ${response.status} ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      setError(`Failed to create folder: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    try {
      setOperationLoading(`Deleting file: ${filePath}`);
      setError(null);

      // Get valid session with automatic refresh
      const validSession = await getValidSession();
      if (!validSession) {
        setError('Session expired. Please refresh the page to sign in again.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/files/${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${validSession.access_token}`,
        },
      });

      if (response.ok) {
        // Refresh file tree
        fetchFiles();
        onRefresh?.();
      } else {
        const errorText = await response.text();
        setError(`Failed to delete file: ${response.status} ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setError(`Failed to delete file: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDeleteFolder = async (folderPath: string) => {
    try {
      setOperationLoading(`Deleting folder: ${folderPath}`);
      setError(null);

      // Get valid session with automatic refresh
      const validSession = await getValidSession();
      if (!validSession) {
        setError('Session expired. Please refresh the page to sign in again.');
        return;
      }

      // Delete the folder by deleting all files in it (Supabase doesn't have folder concept)
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/files/delete-folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validSession.access_token}`,
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
      } else {
        const errorText = await response.text();
        setError(`Failed to delete folder: ${response.status} ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      setError(`Failed to delete folder: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setOperationLoading(null);
    }
  };

  const checkScaffoldingStatus = async () => {
    if (!projectId) return;
    
    try {
      // Get valid session with automatic refresh
      const validSession = await getValidSession();
      if (!validSession) {
        return;
      }

      // Check for active scaffold jobs
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/jobs?type=SCAFFOLD&status=PENDING,RUNNING`, {
        headers: {
          'Authorization': `Bearer ${validSession.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const hasActiveScaffold = data.jobs && data.jobs.length > 0;
        setIsScaffolding(hasActiveScaffold);
        
      }
    } catch (error) {
      console.error('[ProjectFileExplorer] Error checking scaffolding status:', error);
    }
  };

  const fetchFiles = async (silent = false) => {
    if (!projectId) {
      return;
    }
    
    try {
      if (!silent) setLoading(true);
      if (!silent) setError(null); // Clear errors when doing manual refresh
      
      // Get valid session with automatic refresh
      const validSession = await getValidSession();
      if (!validSession) {
        if (!silent) {
          setError('Session expired. Please refresh the page to sign in again.');
        }
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/files/tree`, {
        headers: {
          'Authorization': `Bearer ${validSession.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newFileCount = data.tree?.length || 0;
        
        setFiles(data.tree || []);
        if (!silent) setError(null); // Clear any previous errors on success
      } else if (response.status === 404) {
        setFiles([]);
        if (!silent) setError(null); // 404 is not really an error for empty projects
      } else if (response.status === 401) {
        // Token still invalid after refresh - need full re-authentication
        if (!silent) {
          setError('Authentication failed. Please refresh the page to sign in again.');
        }
      } else {
        setFiles([]);
        if (!silent) {
          const errorText = await response.text();
          setError(`Failed to load files: ${response.status} ${errorText || response.statusText}`);
        }
      }
    } catch (error) {
      setFiles([]);
      if (!silent) {
        setError(`Failed to load files: ${error instanceof Error ? error.message : 'Network error'}`);
      }
    } finally {
      if (!silent) {
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
    <div className={`flex flex-col h-full ${className}`}>
      {/* Error Banner */}
      {error && (
        <div className="mx-2 mt-2 p-3 bg-red-900/20 border border-red-500 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => fetchFiles()}
                className="p-1 hover:bg-red-800/20 rounded transition-colors"
                title="Retry"
              >
                <RefreshCw className="w-3 h-3 text-red-400" />
              </button>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-800/20 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operation Loading Banner */}
      {operationLoading && (
        <div className="mx-2 mt-2 p-3 bg-blue-900/20 border border-blue-500 rounded-lg">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin flex-shrink-0" />
            <p className="text-sm text-blue-300">{operationLoading}</p>
          </div>
        </div>
      )}

      {/* File Explorer */}
      <div className="flex-1 overflow-hidden">
        <SimpleFileExplorer
          files={files}
          onFileSelect={handleFileSelect}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onDeleteFile={handleDeleteFile}
          onDeleteFolder={handleDeleteFolder}
          selectedFile={selectedFile || undefined}
          projectId={projectId}
          className=""
          isScaffolding={isScaffolding}
        />
      </div>
    </div>
  );
}