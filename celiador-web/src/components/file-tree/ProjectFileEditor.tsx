'use client';

import { useState, useEffect } from 'react';
import { FileEditor } from './FileEditor';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ProjectFileEditorProps {
  projectId: string;
  filePath: string;
  onClose?: () => void;
  className?: string;
}

export function ProjectFileEditor({ 
  projectId, 
  filePath, 
  onClose,
  className 
}: ProjectFileEditorProps) {
  const { session, isLoading: authLoading } = useAuth();
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !filePath) {
      console.log(`[ProjectFileEditor] Missing required props - projectId: ${projectId}, filePath: ${filePath}`);
      setIsLoading(false);
      setFileContent('');
      return;
    }

    if (authLoading) {
      console.log('[ProjectFileEditor] Waiting for authentication to complete...');
      return;
    }
    
    const fetchFileContent = async () => {
      try {
        console.log(`[ProjectFileEditor] Starting fetch for projectId: ${projectId}, filePath: ${filePath}`);
        setIsLoading(true);
        
        if (!session) {
          console.log('[ProjectFileEditor] No session available from AuthContext');
          setFileContent('Error: No authentication session available');
          return;
        }

        console.log(`[ProjectFileEditor] Fetching content for file: ${filePath}`);
        const response = await fetch(`http://localhost:4000/projects/${projectId}/files/${filePath}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[ProjectFileEditor] File content received, size: ${data.file?.content?.length || 0} bytes`);
          setFileContent(data.file?.content || '');
        } else {
          const errorText = await response.text();
          console.error(`[ProjectFileEditor] Failed to fetch file content: ${response.status} - ${errorText}`);
          setFileContent(`Error loading file content: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.error('[ProjectFileEditor] Error fetching file content:', error);
        setFileContent('Error loading file content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileContent();
  }, [projectId, filePath, session, authLoading]);

  const handleSave = async (content: string) => {
    try {
      console.log(`[ProjectFileEditor] Save attempt started - session available: ${!!session}`);
      console.log(`[ProjectFileEditor] Auth loading state: ${authLoading}`);
      console.log(`[ProjectFileEditor] Project ID: ${projectId}, File Path: ${filePath}`);
      
      if (!session) {
        console.error('[ProjectFileEditor] No session available for save operation');
        console.error('[ProjectFileEditor] Session state:', session);
        throw new Error('No authentication session available');
      }

      console.log(`[ProjectFileEditor] Session token length: ${session.access_token.length}`);
      console.log(`[ProjectFileEditor] Saving file ${filePath} for project ${projectId}`);
      const response = await fetch(`http://localhost:4000/projects/${projectId}/files/save`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          filePath: filePath,
          content 
        }),
      });

      if (response.ok) {
        setFileContent(content);
        console.log(`[ProjectFileEditor] File saved successfully`);
      } else {
        const errorText = await response.text();
        console.error(`[ProjectFileEditor] Save failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to save file: ${response.status}`);
      }
    } catch (error) {
      console.error('[ProjectFileEditor] Error saving file:', error);
      throw error;
    }
  };

  const handleDownload = () => {
    // Create a blob from the file content
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <FileEditor
      file={{
        name: filePath.split('/').pop() || filePath,
        type: 'file',
        path: filePath,
        size: fileContent?.length
      }}
      content={fileContent}
      onSave={handleSave}
      onDownload={handleDownload}
      onClose={onClose}
      isReadOnly={false}
      className={className}
    />
  );
}