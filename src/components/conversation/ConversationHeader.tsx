'use client';

import { Button } from '../ui/button';
import { clsx } from 'clsx';

interface ConversationHeaderProps {
  title: string;
  onClose: () => void;
  onMinimize: () => void;
  className?: string;
}

export function ConversationHeader({ 
  title, 
  onClose, 
  onMinimize, 
  className 
}: ConversationHeaderProps) {
  return (
    <div className={clsx(
      'flex items-center justify-between p-4 border-b bg-card',
      className
    )}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <h3 className="font-medium text-sm truncate">
          {title}
        </h3>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          onClick={onMinimize}
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent"
          title="Minimize (Ctrl+/)"
        >
          −
        </Button>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent"
          title="Close"
        >
          ×
        </Button>
      </div>
    </div>
  );
}