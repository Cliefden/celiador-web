'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface ModeToggleTooltipProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function ModeToggleTooltip({ isVisible, onDismiss }: ModeToggleTooltipProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShow(true), 1000); // Show after 1 second
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible]);

  if (!show) return null;

  return (
    <div className="absolute top-full mt-2 right-0 z-[60] w-80">
      <div className="bg-gradient-to-r from-teal-900/95 to-cyan-900/95 backdrop-blur-sm border border-teal-500/50 rounded-lg p-4 shadow-xl">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-teal-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-1">🎉 New Feature: AI-Enhanced Mode!</h3>
            <p className="text-xs text-gray-200 mb-3">
              Toggle between Classic dashboard and our new AI-Enhanced mode with intelligent assistance, proactive suggestions, and multi-agent coordination.
            </p>
            <button
              onClick={onDismiss}
              className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded transition-colors"
            >
              Try AI Enhanced Mode
            </button>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}