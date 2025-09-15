'use client';

import { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../ui/button';
import { ProjectFileEditor } from './ProjectFileEditor';

interface FullscreenFileEditorProps {
  projectId: string;
  filePath: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenFileEditor({
  projectId,
  filePath,
  isOpen,
  onClose
}: FullscreenFileEditorProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className={`fixed inset-0 bg-background shadow-2xl transition-all duration-300 ${
        isMinimized ? 'inset-x-4 inset-y-4 rounded-lg border' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <div className="ml-4 font-mono text-sm text-muted-foreground">
              {filePath}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Editor Content */}
        <div className="h-[calc(100vh-73px)] overflow-hidden">
          <ProjectFileEditor
            projectId={projectId}
            filePath={filePath}
            onClose={onClose}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}