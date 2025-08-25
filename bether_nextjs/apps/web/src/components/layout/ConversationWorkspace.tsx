'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConversationPanel } from '../conversation/ConversationPanel';
import { ProjectFileExplorer } from '../file-tree/ProjectFileExplorer';
import { ProjectFileEditor } from '../file-tree/ProjectFileEditor';
import { PreviewFrame, PreviewDevice } from '../preview/PreviewFrame';
import { usePreview } from '../../hooks/usePreview';
import { 
  MessageCircle, 
  FolderOpen, 
  Code,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Monitor
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';

interface Project {
  id: string;
  name: string;
}

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileItem[];
}

interface ConversationWorkspaceProps {
  selectedProject: Project | null;
}

export function ConversationWorkspace({ selectedProject }: ConversationWorkspaceProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileExplorerCollapsed, setFileExplorerCollapsed] = useState(false);
  const [conversationCollapsed, setConversationCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'preview'>('chat');
  const [isMobile, setIsMobile] = useState(false);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');

  // Use preview hook
  const { 
    preview, 
    loading: previewLoading, 
    error: previewError, 
    startPreview, 
    stopPreview, 
    restartPreview 
  } = usePreview(selectedProject?.id || null);

  // Function to refresh file explorer
  const refreshFileExplorer = useCallback(() => {
    setFileRefreshKey(prev => prev + 1);
  }, []);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset selected file when project changes
  useEffect(() => {
    if (selectedProject) {
      console.log(`[ConversationWorkspace] Project changed to: ${selectedProject.name} (${selectedProject.id})`);
      setSelectedFile(null); // Clear selected file when switching projects
    }
  }, [selectedProject?.id]);

  // Mobile view - use tabs
  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'files' | 'preview')} className="flex-1 flex flex-col">
          <div className="border-b px-4 py-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center space-x-2">
                <FolderOpen className="w-4 h-4" />
                <span>Files</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center space-x-2">
                <Monitor className="w-4 h-4" />
                <span>Preview</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="chat" className="flex-1 m-0">
            <ConversationPanel 
              selectedProject={selectedProject} 
              onFileOperation={refreshFileExplorer}
              embedded={true}
            />
          </TabsContent>
          
          <TabsContent value="files" className="flex-1 m-0">
            <div className="h-full flex flex-col">
              <ProjectFileExplorer 
                projectId={selectedProject?.id || ''} 
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
                onRefresh={refreshFileExplorer}
                key={`mobile-${fileRefreshKey}`}
              />
              {selectedFile && (
                <div className="flex-1 border-t">
                  <ProjectFileEditor
                    projectId={selectedProject?.id || ''}
                    filePath={selectedFile}
                    onClose={() => setSelectedFile(null)}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 m-0">
            <PreviewFrame
              projectId={selectedProject?.id || ''}
              preview={preview}
              device={previewDevice}
              onDeviceChange={setPreviewDevice}
              onStart={startPreview}
              onStop={stopPreview}
              onRestart={restartPreview}
              loading={previewLoading}
              error={previewError}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop view - three-panel layout
  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Conversation Panel */}
      <div className={`flex flex-col border-r transition-all duration-300 overflow-hidden ${
        conversationCollapsed ? 'w-12' : 'w-1/3'
      }`}>
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          {!conversationCollapsed && (
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold">Conversation</h2>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConversationCollapsed(!conversationCollapsed)}
            className="p-1"
          >
            {conversationCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {!conversationCollapsed && (
          <div className="flex-1 overflow-hidden">
            <ConversationPanel 
              selectedProject={selectedProject} 
              onFileOperation={refreshFileExplorer}
              embedded={true}
            />
          </div>
        )}
      </div>

      {/* File Explorer & Editor Panel */}
      <div className={`flex flex-col border-r transition-all duration-300 overflow-hidden ${
        conversationCollapsed ? 'w-1/2' : 'w-1/3'
      }`}>
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          {!fileExplorerCollapsed && (
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold">Files</h2>
              {selectedFile && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Code className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-mono">
                    {selectedFile.split('/').pop()}
                  </span>
                </>
              )}
            </div>
          )}
          <div className="flex items-center space-x-1">
            {selectedFile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="p-1"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFileExplorerCollapsed(!fileExplorerCollapsed)}
              className="p-1"
            >
              {fileExplorerCollapsed ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        {!fileExplorerCollapsed && (
          <div className="flex-1 flex overflow-hidden">
            {/* File Explorer */}
            <div className={`border-r transition-all duration-300 overflow-auto ${
              selectedFile ? 'w-80' : 'flex-1'
            }`}>
              <ProjectFileExplorer 
                projectId={selectedProject?.id || ''} 
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
                onRefresh={refreshFileExplorer}
                key={`desktop-${fileRefreshKey}`}
              />
            </div>
            
            {/* File Editor */}
            {selectedFile && (
              <div className="flex-1 overflow-auto">
                <ProjectFileEditor
                  projectId={selectedProject?.id || ''}
                  filePath={selectedFile}
                  onClose={() => setSelectedFile(null)}
                />
              </div>
            )}
            
            {/* Empty state when no file selected */}
            {!selectedFile && selectedProject && (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a file to edit</p>
                  <p className="text-sm">Choose a file from the explorer or ask AI to create one</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Panel */}
      <div className={`flex flex-col transition-all duration-300 overflow-hidden ${
        conversationCollapsed ? 'w-1/2' : 'w-1/3'
      }`}>
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Preview</h2>
            {preview && (
              <div className={`w-2 h-2 rounded-full ${
                preview.status === 'running' ? 'bg-green-500' :
                preview.status === 'starting' || preview.status === 'syncing' ? 'bg-yellow-500' :
                preview.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <PreviewFrame
            projectId={selectedProject?.id || ''}
            preview={preview}
            device={previewDevice}
            onDeviceChange={setPreviewDevice}
            onStart={startPreview}
            onStop={stopPreview}
            onRestart={restartPreview}
            loading={previewLoading}
            error={previewError}
          />
        </div>
      </div>
    </div>
  );
}