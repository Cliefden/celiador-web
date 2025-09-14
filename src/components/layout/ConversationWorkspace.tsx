'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConversationPanel } from '../conversation/ConversationPanel';
import { ProjectFileExplorer } from '../file-tree/ProjectFileExplorer';
import { IntegrationSetup } from '../integrations/IntegrationSetup';
import { DeploymentButtons } from '../integrations/DeploymentButtons';
import { CommandsPanel } from '../commands/CommandsPanel';
import { ClaudeCodePanel } from '../claude-code/ClaudeCodePanel';
import { ProjectFileEditor } from '../file-tree/ProjectFileEditor';
import { FullscreenFileEditor } from '../file-tree/FullscreenFileEditor';
import { PreviewFrame, PreviewDevice } from '../preview/PreviewFrame';
import { usePreview } from '../../hooks/usePreview';
import { useConversation } from '../conversation/useConversation';
import { supabase } from '../../lib/supabase';
import { 
  MessageCircle, 
  FolderOpen, 
  Code,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Monitor,
  Rocket,
  X,
  Terminal
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

// Add a global refresh function for commands
let globalCommandsRefresh: (() => void) | null = null;

export function ConversationWorkspace({ selectedProject }: ConversationWorkspaceProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileExplorerCollapsed, setFileExplorerCollapsed] = useState(false);
  const [conversationCollapsed, setConversationCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'preview' | 'deploy' | 'commands' | 'claude-code'>('chat');
  const [isMobile, setIsMobile] = useState(false);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [fullscreenEditor, setFullscreenEditor] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [inspectionMode, setInspectionMode] = useState(false);
  const [commandsCollapsed, setCommandsCollapsed] = useState(false);

  // Inspection mode toggle
  const toggleInspectionMode = () => {
    setInspectionMode(prev => !prev);
  };
  const [claudeCodeCollapsed, setClaudeCodeCollapsed] = useState(false);

  // Use preview hook
  const { 
    preview, 
    loading: previewLoading, 
    error: previewError, 
    startPreview, 
    stopPreview, 
    restartPreview 
  } = usePreview(selectedProject?.id || null);

  // Use conversation hook
  const conversationHook = useConversation(selectedProject?.id);
  const { sendMessage } = conversationHook;

  // Function to refresh file explorer
  const refreshFileExplorer = useCallback(() => {
    setFileRefreshKey(prev => prev + 1);
  }, []);

  // Function to add command to conversation
  const handleCommandToConversation = useCallback(async (commandText: string, commandType: 'text' | 'voice' | 'generated', commandId?: string) => {
    console.log('ConversationWorkspace: handleCommandToConversation called with:', { commandText, commandType, commandId });
    try {
      // Switch to chat tab first
      console.log('ConversationWorkspace: Switching to chat tab');
      setActiveTab('chat');
      
      // Send the command as a message with appropriate type
      const messageType = commandType === 'voice' ? 'voice' : 'text';
      console.log('ConversationWorkspace: Sending message with type:', messageType);
      await sendMessage(commandText, messageType);
      console.log('ConversationWorkspace: Message sent successfully');
      
      // Update command status to 'completed' if commandId provided
      if (commandId) {
        try {
          console.log('ConversationWorkspace: Updating command status to completed for:', commandId);
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const updateResponse = await fetch(`/api/projects/${selectedProject?.id}/commands`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                commandId,
                status: 'completed',
                response: 'Added to conversation'
              })
            });
            
            console.log('ConversationWorkspace: Command status update response:', updateResponse.status);
            if (!updateResponse.ok) {
              const errorText = await updateResponse.text();
              console.error('ConversationWorkspace: Failed to update command status:', errorText);
            } else {
              console.log('ConversationWorkspace: Command status updated successfully');
              // Force refresh of commands panel
              if ((window as any).globalCommandsRefresh) {
                console.log('ConversationWorkspace: Triggering commands refresh');
                (window as any).globalCommandsRefresh();
              }
            }
          }
        } catch (updateError) {
          console.error('Failed to update command status:', updateError);
        }
      }
    } catch (error) {
      console.error('Failed to add command to conversation:', error);
    }
  }, [sendMessage, setActiveTab, selectedProject?.id]);

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
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'files' | 'preview' | 'deploy' | 'commands' | 'claude-code')} className="flex-1 flex flex-col">
          <div className="border-b px-4 py-2">
            <TabsList className="grid w-full grid-cols-6">
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
              <TabsTrigger value="deploy" className="flex items-center space-x-2">
                <Rocket className="w-4 h-4" />
                <span>Deploy</span>
              </TabsTrigger>
              <TabsTrigger value="commands" className="flex items-center space-x-2">
                <Terminal className="w-4 h-4" />
                <span>Commands</span>
              </TabsTrigger>
              <TabsTrigger value="claude-code" className="flex items-center space-x-2">
                <Code className="w-4 h-4" />
                <span>Claude Code</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="chat" className="flex-1 m-0">
            <ConversationPanel 
              selectedProject={selectedProject} 
              onFileOperation={refreshFileExplorer}
              embedded={true}
              conversationHook={conversationHook}
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
                <div className="flex-1 border-t flex flex-col">
                  <div className="flex items-center justify-between p-2 border-b bg-muted/30">
                    <span className="text-sm font-mono text-muted-foreground">
                      {selectedFile.split('/').pop()}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFullscreenEditor(true)}
                        className="p-1"
                        title="Open in fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="p-1"
                        title="Close editor"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <ProjectFileEditor
                      projectId={selectedProject?.id || ''}
                      filePath={selectedFile}
                      onClose={() => setSelectedFile(null)}
                      className="h-full"
                    />
                  </div>
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
              inspectionMode={inspectionMode}
              onToggleInspection={toggleInspectionMode}
            />
          </TabsContent>

          <TabsContent value="deploy" className="flex-1 m-0 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Integration Setup</h3>
                <IntegrationSetup 
                  projectId={selectedProject?.id || ''} 
                  onIntegrationChange={() => {
                    console.log('Integration changed');
                  }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Deploy</h3>
                <DeploymentButtons 
                  projectId={selectedProject?.id || ''} 
                  onDeploymentStart={() => {
                    console.log('Deployment started');
                  }}
                  onDeploymentComplete={(result) => {
                    console.log('Deployment completed:', result);
                  }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="commands" className="flex-1 m-0">
            <CommandsPanel 
              projectId={selectedProject?.id || ''}
              className="h-full"
              onCommandToConversation={handleCommandToConversation}
            />
          </TabsContent>

          <TabsContent value="claude-code" className="flex-1 m-0">
            <ClaudeCodePanel 
              projectId={selectedProject?.id || ''}
              className="h-full"
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
              conversationHook={conversationHook}
            />
          </div>
        )}
      </div>

      {/* File Explorer & Editor Panel */}
      <div className={`flex flex-col border-r transition-all duration-300 overflow-hidden ${
        conversationCollapsed && previewCollapsed && commandsCollapsed && claudeCodeCollapsed ? 'flex-1' :
        (conversationCollapsed && previewCollapsed && commandsCollapsed) || (conversationCollapsed && previewCollapsed && claudeCodeCollapsed) || (conversationCollapsed && commandsCollapsed && claudeCodeCollapsed) || (previewCollapsed && commandsCollapsed && claudeCodeCollapsed) ? 'w-1/2' :
        (conversationCollapsed && previewCollapsed) || (conversationCollapsed && commandsCollapsed) || (conversationCollapsed && claudeCodeCollapsed) || (previewCollapsed && commandsCollapsed) || (previewCollapsed && claudeCodeCollapsed) || (commandsCollapsed && claudeCodeCollapsed) ? 'w-1/3' :
        conversationCollapsed || previewCollapsed || commandsCollapsed || claudeCodeCollapsed ? 'w-1/4' : 'w-1/5'
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
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFullscreenEditor(true)}
                  className="p-1"
                  title="Open in fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="p-1"
                  title="Close editor"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFileExplorerCollapsed(!fileExplorerCollapsed)}
              className="p-1"
              title={fileExplorerCollapsed ? "Expand files panel" : "Collapse files panel"}
            >
              {fileExplorerCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        {!fileExplorerCollapsed && (
          <div className="flex-1 flex overflow-hidden">
            {/* File Explorer */}
            <div className={`border-r transition-all duration-300 overflow-auto ${
              selectedFile ? 
                (conversationCollapsed && previewCollapsed ? 'w-56' :
                 previewCollapsed ? 'w-64' : 'w-80') : 'flex-1'
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
        previewCollapsed ? 'w-12' :
        conversationCollapsed && commandsCollapsed && claudeCodeCollapsed ? 'w-1/2' :
        (conversationCollapsed && commandsCollapsed) || (conversationCollapsed && claudeCodeCollapsed) || (commandsCollapsed && claudeCodeCollapsed) ? 'w-1/3' :
        conversationCollapsed || commandsCollapsed || claudeCodeCollapsed ? 'w-1/4' : 'w-1/5'
      }`}>
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          {!previewCollapsed && (
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
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewCollapsed(!previewCollapsed)}
            className="p-1"
            title={previewCollapsed ? "Expand preview panel" : "Collapse preview panel"}
          >
            {previewCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {!previewCollapsed && (
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
              inspectionMode={inspectionMode}
              onToggleInspection={toggleInspectionMode}
            />
          </div>
        )}
      </div>

      {/* Commands Panel */}
      <div className={`flex flex-col border-l transition-all duration-300 overflow-hidden ${
        commandsCollapsed ? 'w-12' :
        conversationCollapsed && previewCollapsed && claudeCodeCollapsed ? 'w-1/2' :
        (conversationCollapsed && previewCollapsed) || (conversationCollapsed && claudeCodeCollapsed) || (previewCollapsed && claudeCodeCollapsed) ? 'w-1/3' :
        conversationCollapsed || previewCollapsed || claudeCodeCollapsed ? 'w-1/4' : 'w-1/5'
      }`}>
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          {!commandsCollapsed && (
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold">Commands</h2>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCommandsCollapsed(!commandsCollapsed)}
            className="p-1"
            title={commandsCollapsed ? "Expand commands panel" : "Collapse commands panel"}
          >
            {commandsCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {!commandsCollapsed && (
          <div className="flex-1 overflow-hidden">
            <CommandsPanel 
              projectId={selectedProject?.id || ''}
              className="h-full"
              onCommandToConversation={handleCommandToConversation}
            />
          </div>
        )}
      </div>

      {/* Claude Code Panel */}
      <div className={`flex flex-col border-l transition-all duration-300 overflow-hidden ${
        claudeCodeCollapsed ? 'w-12' :
        conversationCollapsed && previewCollapsed && commandsCollapsed ? 'w-1/2' :
        (conversationCollapsed && previewCollapsed) || (conversationCollapsed && commandsCollapsed) || (previewCollapsed && commandsCollapsed) ? 'w-1/3' :
        conversationCollapsed || previewCollapsed || commandsCollapsed ? 'w-1/4' : 'w-1/5'
      }`}>
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          {!claudeCodeCollapsed && (
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold">Claude Code</h2>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setClaudeCodeCollapsed(!claudeCodeCollapsed)}
            className="p-1"
            title={claudeCodeCollapsed ? "Expand Claude Code panel" : "Collapse Claude Code panel"}
          >
            {claudeCodeCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {!claudeCodeCollapsed && (
          <div className="flex-1 overflow-hidden">
            <ClaudeCodePanel 
              projectId={selectedProject?.id || ''}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Fullscreen File Editor Modal */}
      {selectedFile && (
        <FullscreenFileEditor
          projectId={selectedProject?.id || ''}
          filePath={selectedFile}
          isOpen={fullscreenEditor}
          onClose={() => setFullscreenEditor(false)}
        />
      )}
    </div>
  );
}