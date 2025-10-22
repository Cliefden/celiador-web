'use client';

import { useState, useEffect } from 'react';
import { X, Files, MessageSquare, Settings, Activity, Code2, Github, Triangle } from 'lucide-react';
import { ProjectFileExplorer } from '../file-tree/ProjectFileExplorer';
import { ActivityFeed } from '../activity/ActivityFeed';
import { GitHubIntegrationPanel } from '../integrations/GitHubIntegrationPanel';
import { VercelIntegrationPanel } from '../integrations/VercelIntegrationPanel';
import { FloatingSettingsPanel } from '../settings/FloatingSettingsPanel';

export type FloatingWindowContent = 'files' | 'chat' | 'activity' | 'settings' | 'code' | 'integrations';

interface FloatingWindowProps {
  isOpen: boolean;
  onClose: () => void;
  content: FloatingWindowContent;
  projectId?: string;
  onFileSelect?: (filePath: string) => void;
  selectedFile?: string | null;
}

const contentConfig = {
  files: {
    title: 'Project Files',
    icon: Files,
    description: 'Browse and manage your project files'
  },
  chat: {
    title: 'AI Assistant',
    icon: MessageSquare,
    description: 'Chat with AI about your project'
  },
  activity: {
    title: 'Activity',
    icon: Activity,
    description: 'View project activity and logs'
  },
  settings: {
    title: 'Settings',
    icon: Settings,
    description: 'Configure project settings'
  },
  code: {
    title: 'Code Assistant',
    icon: Code2,
    description: 'AI-powered code assistance'
  },
  integrations: {
    title: 'Integrations',
    icon: Github,
    description: 'Manage GitHub and Vercel integrations'
  }
};

export function FloatingWindow({
  isOpen,
  onClose,
  content,
  projectId,
  onFileSelect,
  selectedFile
}: FloatingWindowProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready, then slide in
      const timer = setTimeout(() => setIsAnimating(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const config = contentConfig[content];
  const IconComponent = config.icon;

  const renderContent = () => {
    switch (content) {
      case 'files':
        return projectId ? (
          <ProjectFileExplorer
            projectId={projectId}
            onFileSelect={onFileSelect || (() => {})}
            selectedFile={selectedFile}
            className="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-300">
            <p>No project selected</p>
          </div>
        );
      
      case 'chat':
        return (
          <div className="p-4 h-full flex items-center justify-center text-gray-300">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>AI Chat coming soon...</p>
            </div>
          </div>
        );
      
      case 'activity':
        return projectId ? (
          <ActivityFeed
            projectId={projectId}
            className="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-300">
            <p>No project selected</p>
          </div>
        );
      
      case 'settings':
        return (
          <FloatingSettingsPanel className="h-full" />
        );
      
      case 'code':
        return (
          <div className="p-4 h-full flex items-center justify-center text-gray-300">
            <div className="text-center">
              <Code2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Code assistant coming soon...</p>
            </div>
          </div>
        );
      
      case 'integrations':
        return projectId ? (
          <IntegrationsTabPanel projectId={projectId} />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-300">
            <p>No project selected</p>
          </div>
        );
      
      default:
        return (
          <div className="p-4 h-full flex items-center justify-center text-gray-300">
            <p>Content not found</p>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-[60] ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={onClose}
      />
      
      {/* Floating Window */}
      <div className={`
        fixed right-0 top-0 h-full w-96 bg-gray-900 shadow-2xl z-[70]
        transform transition-transform duration-300 ease-out
        ${isAnimating ? 'translate-x-full' : 'translate-x-0'}
        flex flex-col border-l border-gray-700
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <IconComponent className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{config.title}</h2>
              <p className="text-xs text-gray-400">{config.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </>
  );
}

{/* Integrations Tab Panel Component */}
interface IntegrationsTabPanelProps {
  projectId: string;
}

function IntegrationsTabPanel({ projectId }: IntegrationsTabPanelProps) {
  const [activeTab, setActiveTab] = useState<'github' | 'vercel'>('github');

  return (
    <div className="h-full flex flex-col">
      {/* Tab Header */}
      <div className="flex border-b border-gray-700 bg-gray-800/50">
        <button
          onClick={() => setActiveTab('github')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'github'
              ? 'bg-gray-700 text-white border-b-2 border-teal-400'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <Github className="w-4 h-4" />
          <span>GitHub</span>
        </button>
        <button
          onClick={() => setActiveTab('vercel')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'vercel'
              ? 'bg-gray-700 text-white border-b-2 border-teal-400'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <Triangle className="w-4 h-4" />
          <span>Vercel</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'github' ? (
          <GitHubIntegrationPanel
            projectId={projectId}
            className="h-full overflow-y-auto"
          />
        ) : (
          <VercelIntegrationPanel
            projectId={projectId}
            className="h-full overflow-y-auto"
          />
        )}
      </div>
    </div>
  );
}

// Floating Action Button Component
interface FloatingActionButtonProps {
  content: FloatingWindowContent;
  onClick: () => void;
  className?: string;
}

export function FloatingActionButton({ content, onClick, className = '' }: FloatingActionButtonProps) {
  const config = contentConfig[content];
  const IconComponent = config.icon;

  return (
    <button
      onClick={onClick}
      className={`
        w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 
        hover:from-teal-600 hover:to-cyan-600
        rounded-full shadow-lg hover:shadow-xl
        flex items-center justify-center
        transition-all duration-200 transform hover:scale-105
        text-white
        ${className}
      `}
      title={config.title}
    >
      <IconComponent className="w-5 h-5" />
    </button>
  );
}