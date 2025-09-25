'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { CreateProjectModal } from '../project/CreateProjectModal';
import { useConversation } from '../conversation/useConversation';
import { usePreview } from '../../hooks/usePreview';
import { PreviewOverlay } from '../inspection/PreviewOverlay';
import { FloatingWindowController } from './FloatingWindowController';
import { 
  Plus, 
  Send, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Rocket, 
  Loader2,
  Sparkles,
  ChevronDown,
  LogOut,
  User,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  Search,
  MousePointer
} from 'lucide-react';
import { SettingsMenuItem } from '../settings/SettingsPanel';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  templatekey: string;
  repoprovider: string;
  repoowner: string;
  reponame: string;
  createdat: string;
  updatedat: string;
}

interface SimpleDashboardProps {
  initialUser: User;
  onLogout: () => void;
}

type PreviewDevice = 'mobile' | 'tablet' | 'desktop';

interface UIElement {
  id: string;
  type: string;
  selector: string;
  componentName?: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata?: {
    filePath?: string;
    lineNumber?: number;
    props?: Record<string, any>;
  };
}

export function SimpleDashboard({ initialUser, onLogout }: SimpleDashboardProps) {
  console.log('🔄 SimpleDashboard rendering with persistence enabled');
  
  const [user] = useState<User>(initialUser);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null);
  const [inspectionMode, setInspectionMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<UIElement | null>(null);
  const [uiElements, setUIElements] = useState<UIElement[]>([]);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);
  const [chatPanelWidth, setChatPanelWidth] = useState(384); // Default 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  
  // Handle responsive layout
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Listen for messages from same-origin preview iframe
  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent) => {
      console.log('📨 Received message from:', event.origin, 'Type:', event.data?.type);

      if (event.data.type === 'ELEMENTS_MAPPED') {
        console.log('📥 Received elements from preview iframe:', event.data.elements?.length || 0);
        setUIElements(event.data.elements || []);
      } else if (event.data.type === 'ELEMENT_SELECTED') {
        console.log('🎯 Element selected in preview iframe:', event.data.element);
        setSelectedElement(event.data.element);
      }
    };

    console.log('🎧 Setting up preview message listener');
    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
        setShowProjectMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Use conversation hook for the selected project
  const conversationHook = useConversation(selectedProject?.id);
  const { conversation, messages, sendMessage, isLoading: conversationLoading } = conversationHook || {};
  
  // Use preview hook for the selected project
  const { preview, loading: previewLoading, error: previewError, loadingMessage, startPreview, restartPreview } = usePreview(selectedProject?.id || null);

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/projects`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (response.ok) {
          const projectsData = await response.json();
          console.log('[SimpleDashboard] Projects loaded:', projectsData.length);
          setProjects(projectsData);
          
          // Try to restore selected project from localStorage
          const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('selectedProjectId') : null;
          console.log('[SimpleDashboard] Saved project ID from localStorage:', savedProjectId);
          
          if (savedProjectId && projectsData.length > 0) {
            const savedProject = projectsData.find((p: Project) => p.id === savedProjectId);
            if (savedProject) {
              console.log('[SimpleDashboard] Restored selected project from localStorage:', savedProject.name);
              setSelectedProject(savedProject);
              return; // Exit early, don't auto-select first project
            } else {
              console.log('[SimpleDashboard] Saved project not found, clearing localStorage');
              localStorage.removeItem('selectedProjectId');
            }
          }
          
          // Auto-select first project if no saved selection was restored
          if (projectsData.length > 0) {
            console.log('[SimpleDashboard] Auto-selecting first project:', projectsData[0].name);
            setSelectedProject(projectsData[0]);
            localStorage.setItem('selectedProjectId', projectsData[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Reset iframe loaded state and preview URL when preview or project changes
  useEffect(() => {
    console.log('🔄 Project or preview changed - clearing iframe state and preview URL');
    setIframeLoaded(false);
    setCurrentPreviewUrl(null); // Clear stale preview URL when switching projects
  }, [selectedProject?.id]); // Only depend on project ID, not preview URL to avoid loops

  // Set preview URL when preview or inspection mode changes
  useEffect(() => {
    const updatePreviewUrl = async () => {
      console.log('🔄 updatePreviewUrl called - preview status:', preview?.status, 'preview ID:', preview?.id);
      if (preview?.status === 'running') {
        console.log('🔄 Preview is running, getting preview URL...');
        const url = await getPreviewUrl();
        console.log('🔄 Got URL from getPreviewUrl:', url, '(type:', typeof url, ')');
        setCurrentPreviewUrl(url);
        console.log('🔄 Set currentPreviewUrl to:', url);
      } else {
        console.log('🔄 Preview not running (status:', preview?.status, '), setting currentPreviewUrl to null');
        setCurrentPreviewUrl(null);
      }
    };
    
    updatePreviewUrl();
  }, [preview?.url, preview?.status, preview?.id, inspectionMode, selectedProject?.id]);

  // Add a simple fallback timer for stuck previews
  useEffect(() => {
    if (!preview || preview.status !== 'starting' && preview.status !== 'syncing') {
      return; // No need for fallback timer
    }

    console.log('🕐 Setting up fallback timer for preview that might be stuck in', preview.status, 'state');
    
    // If preview is still starting/syncing after 30 seconds, force refresh the status
    const fallbackTimer = setTimeout(async () => {
      console.log('🕐 Fallback: Preview may be stuck, attempting manual status check');
      // Force a manual refresh by calling the hook's refreshPreview function
      // This should trigger the loadPreview function which will check current status
      window.location.reload(); // Simple but effective fallback
    }, 30000); // 30 seconds

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [preview?.id, preview?.status]);


  // Listen for messages from inspection preview iframe
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      console.log('📨 Received message from iframe:', event.origin, event.data);

      // Handle inspection element clicks from the preview server's InspectionOverlay
      if (event.data.type === 'INSPECTION_ELEMENT_CLICKED') {
        const inspectableElement = event.data.element;
        console.log('🎯 Inspection element clicked:', inspectableElement);
        
        // Convert from InspectableElement to UIElement format
        const uiElement: UIElement = {
          id: inspectableElement.id,
          type: inspectableElement.type,
          selector: inspectableElement.selector,
          componentName: inspectableElement.text || inspectableElement.type,
          boundingBox: {
            x: inspectableElement.x,
            y: inspectableElement.y,
            width: inspectableElement.width,
            height: inspectableElement.height
          }
        };
        
        handleElementSelection(uiElement);
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  // Reset inspection mode when project changes
  useEffect(() => {
    if (selectedProject) {
      setInspectionMode(false);
      setSelectedElement(null);
      setUIElements([]);
    }
  }, [selectedProject?.id]);

  // Handle panel resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // Calculate new width based on mouse position
      const newWidth = Math.max(280, Math.min(600, e.clientX - 24)); // Min 280px, Max 600px, account for padding
      setChatPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedProject || conversationLoading || !sendMessage) return;
    
    setIsBuilding(true);
    
    // Enhanced message with element context if an element is selected
    let enhancedMessage = currentMessage;
    if (selectedElement) {
      // Try to get the actual text content from the DOM element
      let textContent = '';
      if (selectedElement.type === 'h1' && selectedElement.componentName === 'WelcomeHeading') {
        textContent = 'Welcome to Celiador'; // Known text content
      }
      
      const elementContext = `

SELECTED UI ELEMENT CONTEXT:
- Element Type: ${selectedElement.type}
- Component Name: ${selectedElement.componentName || 'Unknown'}
- CSS Selector: ${selectedElement.selector}
- Text Content: ${textContent || 'Not available'}
- Position: x=${selectedElement.boundingBox.x}, y=${selectedElement.boundingBox.y}
- Size: ${selectedElement.boundingBox.width}x${selectedElement.boundingBox.height}px
${selectedElement.metadata?.props ? `- Properties: ${JSON.stringify(selectedElement.metadata.props, null, 2)}` : ''}

The user has visually selected this specific UI element and wants to modify it. Please search through the provided project files to find this element and make the requested changes using the action format.`;
      
      enhancedMessage += elementContext;
    }
    
    await sendMessage(enhancedMessage);
    setCurrentMessage('');
    setSelectedElement(null); // Clear selection after sending
    setIsBuilding(false);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject);
    setShowCreateProject(false);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/projects/${project.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== project.id));
        if (selectedProject?.id === project.id) {
          const remainingProjects = projects.filter(p => p.id !== project.id);
          const newSelection = remainingProjects.length > 0 ? remainingProjects[0] : null;
          setSelectedProject(newSelection);
          // Update localStorage with new selection or clear it
          if (newSelection) {
            localStorage.setItem('selectedProjectId', newSelection.id);
          } else {
            localStorage.removeItem('selectedProjectId');
          }
        }
        setShowProjectMenu(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };


  const toggleInspectionMode = () => {
    const newMode = !inspectionMode;
    console.log(`🔄 Toggling inspection mode: ${inspectionMode} -> ${newMode}`);
    
    try {
      setInspectionMode(newMode);
      setSelectedElement(null);
      
      // The useEffect will reload the iframe with the proxy URL containing the inspection script
      // We'll send the message after the iframe loads
      console.log('⏳ Setting inspection mode - useEffect will reload iframe with appropriate URL');
      
      if (newMode) {
        console.log('✅ Inspection mode enabled - iframe will reload with proxy URL and injected script');
      } else {
        console.log('❌ Inspection mode disabled - iframe will reload with direct URL'); 
      }
      
    } catch (error) {
      console.error('❌ Error toggling inspection mode:', error);
    }
  };

  const handleElementSelection = (element: UIElement) => {
    setSelectedElement(element);
    
    // Update the current message to indicate selected element
    const elementDescription = element.componentName || element.type;
    setCurrentMessage(`Modify ${elementDescription}: `);
  };

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    console.log('[SimpleDashboard] File selected:', filePath);
    // TODO: Open file in editor or show file details
  };

  const getPreviewUrl = async () => {
    console.log('🔄 getPreviewUrl called - preview status:', preview?.status, 'inspectionMode:', inspectionMode);
    
    if (!preview || preview.status !== 'running' || !selectedProject) {
      console.log('❌ Preview not running or no project selected, returning null');
      return null;
    }
    
    const baseUrl = preview.url;
    
    // If inspection mode is enabled, use the server-side inspection route
    if (inspectionMode && preview.id) {
      try {
        // Get auth token for inspection route
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token;
        
        if (!authToken) {
          console.error('🔍 No auth token available for inspection mode');
          return baseUrl; // Fall back to normal preview
        }
        
        const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
        const inspectionUrl = `${apiUrl}/projects/${selectedProject.id}/preview/${preview.id}/inspection?token=${authToken}`;
        console.log('🔍 Using server-side inspection URL with auth token');
        return inspectionUrl;
      } catch (error) {
        console.error('🔍 Error getting auth token for inspection:', error);
        return baseUrl; // Fall back to normal preview
      }
    }
    
    // Normal mode: add authentication to proxy URL
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      if (!authToken) {
        console.error('🔍 No auth token available for normal preview');
        return null;
      }
      
      const urlWithAuth = `${baseUrl}?token=${encodeURIComponent(authToken)}`;
      console.log('📺 Using authenticated preview URL:', urlWithAuth);
      console.log('🔑 Session details:', {
        userId: session.user?.id,
        tokenLength: authToken.length,
        tokenPreview: authToken.substring(0, 20) + '...',
        expires: session.expires_at
      });
      return urlWithAuth;
    } catch (error) {
      console.error('🔍 Error getting auth token for normal preview:', error);
      return null;
    }
  };

  const getDeviceClasses = () => {
    switch (previewDevice) {
      case 'mobile': return 'w-80 h-[640px]';
      case 'tablet': return 'w-[768px] h-[1024px]';
      case 'desktop': return 'w-full h-full';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Window Controller - At top level */}
      <FloatingWindowController
        projectId={selectedProject?.id}
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="px-6 h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Celiador
              </span>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-6">
              <a href="/dashboard" className="text-blue-600 font-medium px-3 py-2 text-sm">
                Dashboard
              </a>
              <a href="/solutions" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200">
                Solutions
              </a>
              <a href="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200">
                About
              </a>
              <a href="/contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200">
                Contact
              </a>
            </nav>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg bg-white/60 hover:bg-white/80 transition-all"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block">
                {user.name || user.email}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            
            {showUserMenu && (
              <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48">
                <SettingsMenuItem />
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 flex flex-col h-[calc(100vh-4rem)]">
        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="mb-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Project:</span>
              <div className="relative" ref={projectDropdownRef}>
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all min-w-48"
                >
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {selectedProject?.name || 'Select project...'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500 ml-auto" />
                </button>
                
                {showProjectDropdown && (
                  <div className="absolute top-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-64 z-20">
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center">
                        <button
                          onClick={() => {
                            console.log('[SimpleDashboard] Project selected:', project.name);
                            setSelectedProject(project);
                            localStorage.setItem('selectedProjectId', project.id);
                            setShowProjectDropdown(false);
                          }}
                          className={`flex-1 px-4 py-2 text-sm text-left hover:bg-gray-50 ${
                            selectedProject?.id === project.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                          }`}
                        >
                          {project.name}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowProjectMenu(showProjectMenu === project.id ? null : project.id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-md mr-2"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Project Menu */}
                    {showProjectMenu && (
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={() => {
                            const projectToDelete = projects.find(p => p.id === showProjectMenu);
                            if (projectToDelete) handleDeleteProject(projectToDelete);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Project</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateProject(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>New App</span>
            </button>
          </div>
        )}

        {!selectedProject ? (
          /* No Project State */
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Celiador</h1>
              <p className="text-gray-600 mb-8">
                Create your first app with AI. Just describe what you want to build.
              </p>
              <button
                onClick={() => setShowCreateProject(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Create Your First App</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Workspace */
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
            {/* Chat Panel - Resizable sidebar */}
            <div 
              className="w-full flex-shrink-0 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mr-2"
              style={{ width: isDesktop ? `${chatPanelWidth}px` : '100%' }}
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">AI Assistant</h2>
                    <p className="text-blue-100 text-sm">Building {selectedProject.name}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {!messages || messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Let's build something amazing!</h3>
                    <p className="text-gray-600 text-sm">
                      Tell me what you want to add or change in your app.
                    </p>
                  </div>
                ) : (
                  (messages || []).map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
                {isBuilding && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-4 rounded-2xl flex items-center space-x-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-gray-700">Building your changes...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-100">
                {/* Selected Element Indicator */}
                {selectedElement && (
                  <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-purple-700">
                      <MousePointer className="h-4 w-4" />
                      <span className="text-sm font-medium">Selected Element:</span>
                      <code className="bg-purple-100 px-2 py-1 rounded text-xs">
                        {selectedElement.componentName || selectedElement.type}
                      </code>
                      <button 
                        onClick={() => setSelectedElement(null)}
                        className="ml-auto text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={
                      selectedElement 
                        ? `Modify ${selectedElement.componentName || selectedElement.type}...`
                        : inspectionMode
                        ? "Click an element in the preview to modify it..."
                        : "Describe what you want to build or change..."
                    }
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={conversationLoading || isBuilding}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || conversationLoading || isBuilding}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Resize Handle */}
            <div 
              className="hidden lg:block w-2 hover:w-3 bg-gray-200 hover:bg-blue-400 cursor-ew-resize transition-all duration-200 relative group mr-2 rounded-sm"
              onMouseDown={handleMouseDown}
              title="Drag to resize AI Assistant panel"
            >
              <div className="absolute inset-y-0 -inset-x-1 flex items-center justify-center group-hover:bg-blue-100/50 transition-colors duration-200 rounded-sm">
                <div className="flex flex-col space-y-0.5">
                  <div className="w-0.5 h-3 bg-gray-400 group-hover:bg-blue-500 rounded-full"></div>
                  <div className="w-0.5 h-3 bg-gray-400 group-hover:bg-blue-500 rounded-full"></div>
                  <div className="w-0.5 h-3 bg-gray-400 group-hover:bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {/* Preview Header */}
              <div className="bg-gray-50 border-b border-gray-200 p-3">
                <div className="flex items-center justify-between min-h-[48px]">
                  <div className="flex items-center space-x-3 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">Live Preview</h3>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Device Selector */}
                    <div className="flex bg-gray-200 rounded-lg p-1 border border-gray-300">
                      <button
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-2 rounded-md transition-all ${
                          previewDevice === 'mobile'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Mobile View"
                      >
                        <Smartphone className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPreviewDevice('tablet')}
                        className={`p-2 rounded-md transition-all ${
                          previewDevice === 'tablet'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Tablet View"
                      >
                        <Tablet className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-2 rounded-md transition-all ${
                          previewDevice === 'desktop'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Desktop View"
                      >
                        <Monitor className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Inspection Mode Toggle */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        toggleInspectionMode();
                      }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                        inspectionMode 
                          ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700' 
                          : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-200'
                      }`}
                      title={inspectionMode ? 'Exit Inspection Mode' : 'Inspect UI Elements'}
                      type="button"
                    >
                      {inspectionMode ? (
                        <>
                          <MousePointer className="h-4 w-4" />
                          <span>Inspecting</span>
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          <span>Inspect</span>
                        </>
                      )}
                    </button>
                    
                    {/* Deploy Button */}
                    <button className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm">
                      <Rocket className="h-4 w-4" />
                      <span className="text-sm font-medium">Deploy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className={`flex-1 bg-gray-100 overflow-hidden ${
                previewDevice === 'desktop' ? 'p-0' : 'p-6 flex items-center justify-center'
              }`}>
                {currentPreviewUrl ? (
                  <div className={
                    previewDevice === 'desktop' 
                      ? 'w-full h-full relative' 
                      : `bg-white rounded-xl shadow-lg overflow-hidden transition-all relative ${getDeviceClasses()}`
                  }>
                    <iframe
                      ref={previewIframeRef}
                      src={currentPreviewUrl}
                      className="w-full h-full border-0"
                      title="App Preview"
                      onLoad={() => {
                        console.log('🎬 Preview iframe loaded with URL:', currentPreviewUrl);
                        
                        // Check if this is the new server-side inspection preview
                        const isInspectionPreview = currentPreviewUrl?.includes('/inspection?');
                        
                        if (isInspectionPreview && inspectionMode) {
                          console.log('🔍 Loaded server-side inspection preview - no postMessage needed');
                        }
                        
                        setTimeout(() => {
                          console.log('✅ Preview content should be ready');
                          setIframeLoaded(true);
                        }, 500);
                      }}
                    />
                    {!iframeLoaded && (
                      <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Loading Preview</h4>
                          <p className="text-gray-600 text-sm">
                            Waiting for app to render...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : preview?.status === 'starting' || preview?.status === 'syncing' || previewLoading ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {preview?.status === 'syncing' ? 'Syncing Files' : 'Starting Preview'}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {loadingMessage || preview?.status === 'syncing' ? 'Downloading project files...' : 'Setting up your app preview...'}
                    </p>
                    {loadingMessage && (
                      <p className="text-blue-600 text-xs mt-2 font-medium">
                        {loadingMessage}
                      </p>
                    )}
                  </div>
                ) : preview?.status === 'error' || previewError ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Preview Error</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      {previewError || preview?.errorMessage || 'Failed to start preview'}
                    </p>
                    {previewError && preview?.errorMessage && previewError !== preview.errorMessage && (
                      <details className="text-left mb-4">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Show technical details
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-700">
                          <div className="mb-2">
                            <strong>API Error:</strong> {previewError}
                          </div>
                          <div>
                            <strong>Preview Status Error:</strong> {preview?.errorMessage}
                          </div>
                        </div>
                      </details>
                    )}
                    <button
                      onClick={startPreview}
                      disabled={previewLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {previewLoading ? 'Starting...' : 'Try Again'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Monitor className="h-8 w-8 text-gray-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Start Preview</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Click to preview your app in the browser.
                    </p>
                    <button
                      onClick={startPreview}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                    >
                      Start Preview
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <CreateProjectModal
          isOpen={showCreateProject}
          onClose={() => setShowCreateProject(false)}
          onProjectCreated={handleProjectCreated}
          userId={user.id}
        />
      )}

      {/* Preview Inspection Overlay - disabled when using server-side inspection */}
      {false && (
        <PreviewOverlay
          isActive={inspectionMode}
          previewIframeRef={previewIframeRef}
          onElementSelect={handleElementSelection}
          deviceClasses={getDeviceClasses()}
        />
      )}
      </div>
    </>
  );
}