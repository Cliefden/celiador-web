'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { History, RotateCcw, Trash2, AlertTriangle, Clock, File } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FileBackup {
  id: string;
  userId: string;
  projectId: string;
  filePath: string;
  originalContent: string;
  backupTimestamp: string;
  operationType: 'update' | 'delete';
  jobId?: string;
}

interface BackupManagerProps {
  projectId: string;
  className?: string;
  onFileRestored?: (filePath: string) => void;
}

export function BackupManager({ 
  projectId, 
  className,
  onFileRestored 
}: BackupManagerProps) {
  const [backups, setBackups] = useState<FileBackup[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBackups();
  }, [projectId]);

  const fetchBackups = async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/projects/${projectId}/backups`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch backups: ${response.status}`);
      }

      const data = await response.json();
      setBackups(data.backups || []);
    } catch (err: any) {
      console.error('Error fetching backups:', err);
      setError(err.message || 'Failed to fetch backups');
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (backupId: string, filePath: string) => {
    setRestoring(backupId);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/backups/${backupId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Restore failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Notify parent component
      onFileRestored?.(filePath);
      
      // Show success (you might want to use a toast notification here)
      console.log(`File restored successfully: ${filePath}`);
      
      // Refresh backups
      await fetchBackups();
    } catch (err: any) {
      console.error('Error restoring backup:', err);
      setError(err.message || 'Failed to restore backup');
    } finally {
      setRestoring(null);
    }
  };

  const cleanupBackups = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/projects/${projectId}/backups/cleanup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keepCount: 10 })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Cleanup failed: ${response.status}`);
      }

      // Refresh backups after cleanup
      await fetchBackups();
    } catch (err: any) {
      console.error('Error cleaning up backups:', err);
      setError(err.message || 'Failed to cleanup backups');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getOperationIcon = (operationType: string) => {
    switch (operationType) {
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      default: return '📝';
    }
  };

  const getOperationColor = (operationType: string) => {
    switch (operationType) {
      case 'update': return 'text-blue-600 dark:text-blue-400';
      case 'delete': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading && backups.length === 0) {
    return (
      <div className={clsx('bg-white dark:bg-gray-900 rounded-lg p-6', className)}>
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2">Loading backups...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('bg-white dark:bg-gray-900 rounded-lg', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              File Backups
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchBackups}
              disabled={loading}
              className="text-sm px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={cleanupBackups}
              disabled={loading}
              className="text-sm px-3 py-1 text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
              title="Clean up old backups (keep last 10 per file)"
            >
              <Trash2 className="w-3 h-3" />
              Cleanup
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Backup List */}
      <div className="max-h-96 overflow-y-auto">
        {backups.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No backups found</p>
            <p className="text-sm mt-1">File backups will appear here after AI makes changes</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {backups.map((backup) => (
              <div key={backup.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-lg">
                      {getOperationIcon(backup.operationType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {backup.filePath}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className={clsx('capitalize', getOperationColor(backup.operationType))}>
                          {backup.operationType}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(backup.backupTimestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => restoreBackup(backup.id, backup.filePath)}
                    disabled={restoring === backup.id}
                    className={clsx(
                      'px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1',
                      restoring === backup.id
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                        : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50'
                    )}
                  >
                    {restoring === backup.id ? (
                      <>
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        Restoring...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}