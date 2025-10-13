'use client';

import { useState, useEffect } from 'react';
import { FileDiffPreview } from '../file-tree/FileDiffPreview';
import { supabase } from '../../lib/supabase';

interface FileOperation {
  type: 'create_file' | 'update_file' | 'delete_file';
  path: string;
  content?: string;
  oldContent?: string;
}

interface FileOperationPreviewProps {
  operations: Array<{
    type: 'create_file' | 'update_file' | 'delete_file';
    path: string;
    content?: string;
  }>;
  projectId: string;
  onApprove: (operations: FileOperation[]) => void;
  onReject: () => void;
  isVisible: boolean;
}

export function FileOperationPreview({
  operations,
  projectId,
  onApprove,
  onReject,
  isVisible
}: FileOperationPreviewProps) {
  const [enrichedOperations, setEnrichedOperations] = useState<FileOperation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible && operations.length > 0) {
      enrichOperationsWithContent();
    }
  }, [isVisible, operations, projectId]);

  const enrichOperationsWithContent = async () => {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('[FileOperationPreview] No auth token available');
        return;
      }

      const enriched: FileOperation[] = [];

      for (const operation of operations) {
        let oldContent = '';
        
        // Fetch existing file content for updates and deletes
        if (operation.type === 'update_file' || operation.type === 'delete_file') {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/projects/${projectId}/files/${encodeURIComponent(operation.path)}`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              oldContent = data.content || '';
            } else {
              console.warn(`[FileOperationPreview] Could not fetch content for ${operation.path}: ${response.status}`);
            }
          } catch (error) {
            console.warn(`[FileOperationPreview] Error fetching content for ${operation.path}:`, error);
          }
        }

        enriched.push({
          ...operation,
          oldContent
        });
      }

      setEnrichedOperations(enriched);
    } catch (error) {
      console.error('[FileOperationPreview] Error enriching operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    onApprove(enrichedOperations);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg font-medium">Loading file changes...</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Analyzing {operations.length} file operation{operations.length !== 1 ? 's' : ''}
            </p>
          </div>
        ) : (
          <FileDiffPreview
            operations={enrichedOperations}
            projectId={projectId}
            onApprove={handleApprove}
            onReject={onReject}
            className="max-h-full overflow-y-auto"
          />
        )}
      </div>
    </div>
  );
}