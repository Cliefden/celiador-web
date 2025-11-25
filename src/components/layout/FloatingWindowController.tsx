'use client';

import { useState } from 'react';
import { FloatingWindow, FloatingActionButton, FloatingWindowContent } from './FloatingWindow';
import { Files, MessageSquare, Activity, Settings, Github } from 'lucide-react';

interface FloatingWindowControllerProps {
  projectId?: string;
  onFileSelect?: (filePath: string) => void;
  selectedFile?: string | null;
  className?: string;
}

export function FloatingWindowController({
  projectId,
  onFileSelect,
  selectedFile,
  className = ''
}: FloatingWindowControllerProps) {
  const [activeWindow, setActiveWindow] = useState<FloatingWindowContent | null>(null);

  const openWindow = (content: FloatingWindowContent) => {
    setActiveWindow(content);
    
    // Dispatch event to notify other components that a floating window opened
    const event = new CustomEvent('floating-window-opened', { detail: { content } });
    window.dispatchEvent(event);
  };

  const closeWindow = () => {
    setActiveWindow(null);
  };

  const availableWindows: FloatingWindowContent[] = ['files', 'activity', 'integrations', 'agents', 'settings'];

  return (
    <div className={className}>
      {/* Floating Action Buttons - Stack vertically from bottom */}
      <div className="fixed right-4 bottom-20 z-[80]">
        <div className="flex flex-col-reverse space-y-reverse space-y-2">
          {availableWindows.map((content, index) => (
            <FloatingActionButton
              key={content}
              content={content}
              onClick={() => openWindow(content)}
              className={`
                transition-all duration-200 ease-out
                ${activeWindow === content ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-black' : ''}
                ${index > 0 ? 'opacity-80 hover:opacity-100' : ''}
              `}
            />
          ))}
        </div>
      </div>

      {/* Floating Window */}
      {activeWindow && (
        <FloatingWindow
          isOpen={true}
          onClose={closeWindow}
          content={activeWindow}
          projectId={projectId}
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
        />
      )}
    </div>
  );
}