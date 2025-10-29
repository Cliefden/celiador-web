'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { CreateProjectModal } from '../project/CreateProjectModal';
import { useConversation } from '../conversation/useConversation';
import { usePreview } from '../../hooks/usePreview';
import { PreviewOverlay } from '../inspection/PreviewOverlay';
import { FloatingWindowController } from './FloatingWindowController';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';
import { WelcomeBanner } from '../onboarding/WelcomeBanner';
import { useOnboarding } from '../../hooks/useOnboarding';
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
  MousePointer,
  RotateCcw
} from 'lucide-react';
import { SettingsMenuItem } from '../settings/SettingsPanel';
import { CeliadorLogo } from '../ui/celiador-logo';

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
  text?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  attributes?: Record<string, any>;
  styles?: Record<string, string>;
  context?: {
    parentTag?: string;
    parentClass?: string;
    siblingCount?: number;
    indexInParent?: number;
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

  // Onboarding state
  const {
    shouldShowOnboarding,
    isNewUser,
    onboardingState,
    completeOnboarding,
    markFirstProjectCreated,
  } = useOnboarding(user.id);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);
  const [currentPreviewPath, setCurrentPreviewPath] = useState<string>('/');
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
      
      // Handle navigation updates from preview iframe
      if (event.data.type === 'PREVIEW_NAVIGATION') {
        const newPath = event.data.path || '/';
        console.log('🧭 Preview navigation detected:', newPath);
        console.log('🧭 Full navigation event data:', event.data);
        setCurrentPreviewPath(newPath);
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  // Track navigation within the preview iframe
  useEffect(() => {
    const handleNavigationMessage = (event: MessageEvent) => {
      // Only handle messages from our preview iframe
      if (event.origin !== window.location.origin) {
        return;
      }

      // Handle navigation tracking messages
      if (event.data.type === 'PREVIEW_NAVIGATION') {
        const newPath = event.data.path || '/';
        console.log('🧭 Navigation detected in preview iframe:', newPath);
        setCurrentPreviewPath(newPath);
      }
    };

    window.addEventListener('message', handleNavigationMessage);
    return () => window.removeEventListener('message', handleNavigationMessage);
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
      const elementContext = `

SELECTED UI ELEMENT CONTEXT:
- Element Type: ${selectedElement.type}
- Component Name: ${selectedElement.componentName || 'Unknown'}
- CSS Selector: ${selectedElement.selector}
- Text Content: ${selectedElement.text || 'Not available'}
${selectedElement.boundingBox ? `- Position: x=${selectedElement.boundingBox.x}, y=${selectedElement.boundingBox.y}` : '- Position: Not available'}
${selectedElement.boundingBox ? `- Size: ${selectedElement.boundingBox.width}x${selectedElement.boundingBox.height}px` : '- Size: Not available'}
${selectedElement.attributes ? `- HTML Attributes: ${JSON.stringify(selectedElement.attributes, null, 2)}` : ''}
${selectedElement.styles ? `- Computed Styles: ${JSON.stringify(selectedElement.styles, null, 2)}` : ''}
${selectedElement.context ? `- Parent Context: ${JSON.stringify(selectedElement.context, null, 2)}` : ''}

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
    
    // Mark first project creation for onboarding
    markFirstProjectCreated();
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
    console.log('🔍 Toggling inspection mode:', { current: inspectionMode, new: newMode });
    
    // When enabling inspection mode, try to get current path from tracking or iframe URL
    if (newMode) {
      console.log('🔍 Getting current path for inspection mode');
      console.log('🔍 currentPreviewPath from tracking:', currentPreviewPath);
      
      // First, try using the tracked path if we have navigation tracking
      if (currentPreviewPath && currentPreviewPath !== '/') {
        console.log('🔍 Using tracked navigation path:', currentPreviewPath);
        // Keep the tracked path
      } else {
        console.log('🔍 No tracked path, trying iframe URL extraction...');
        console.log('🔍 Debug iframe state:', {
          hasIframe: !!previewIframeRef.current,
          iframeSrc: previewIframeRef.current?.src,
          srcLength: previewIframeRef.current?.src?.length
        });
        
        if (previewIframeRef.current?.src) {
          try {
            const iframeSrc = previewIframeRef.current.src;
            console.log('🔍 Extracting path from iframe URL:', iframeSrc);
            
            // Parse the iframe URL to extract the path
            const url = new URL(iframeSrc);
            let extractedPath = '/';
            
            console.log('🔍 URL parts:', {
              pathname: url.pathname,
              hasProxy: url.pathname.includes('/proxy/'),
              fullURL: url.toString()
            });
            
            // Check if it's a proxy URL and extract the path after /proxy/
            if (url.pathname.includes('/proxy/')) {
              const proxyIndex = url.pathname.indexOf('/proxy/');
              const pathAfterProxy = url.pathname.substring(proxyIndex + '/proxy'.length);
              extractedPath = pathAfterProxy || '/';
              console.log('🔍 Path after proxy extraction:', {
                proxyIndex,
                pathAfterProxy,
                extractedPath
              });
            }
            
            console.log('🔍 Final extracted path for inspection:', extractedPath);
            setCurrentPreviewPath(extractedPath);
          } catch (error) {
            console.warn('🔍 Failed to extract path from iframe URL:', error);
            setCurrentPreviewPath('/'); // Fallback to root
          }
        } else {
          console.warn('🔍 No iframe src available, using fallback path');
          setCurrentPreviewPath('/'); // Fallback to root
        }
      }
    }
    
    setInspectionMode(newMode);
    setSelectedElement(null);
  };

  const resetPreview = async () => {
    console.log('🔄 Resetting preview...');
    
    try {
      // Reset iframe state immediately
      setIframeLoaded(false);
      setCurrentPreviewUrl(null);
      
      // Turn off inspection mode if it's on
      if (inspectionMode) {
        setInspectionMode(false);
        setSelectedElement(null);
      }
      
      // If preview is stuck in syncing/starting state, try to stop and restart it
      if (preview && selectedProject && (preview.status === 'syncing' || preview.status === 'starting')) {
        console.log(`🛑 Preview stuck in ${preview.status} state - attempting force restart`);
        
        try {
          // Stop the current preview
          await stopPreview();
          
          // Wait a moment, then start a new preview
          setTimeout(async () => {
            console.log('🚀 Starting fresh preview after reset...');
            await startPreview();
          }, 1000);
        } catch (error) {
          console.error('❌ Error force restarting preview:', error);
          // Fall back to just refreshing the URL
          setTimeout(async () => {
            if (preview?.status === 'running') {
              const url = await getPreviewUrl();
              setCurrentPreviewUrl(url);
            }
          }, 100);
        }
      } else {
        // For running previews or no preview, just refresh the URL
        setTimeout(async () => {
          if (preview?.status === 'running') {
            const url = await getPreviewUrl();
            setCurrentPreviewUrl(url);
          }
        }, 100);
      }
      
      console.log('✅ Preview reset successfully');
    } catch (error) {
      console.error('❌ Error resetting preview:', error);
    }
  };

  const handleElementSelection = async (element: UIElement) => {
    setSelectedElement(element);
    
    // Create an automatic conversation message when an element is clicked in inspection mode
    if (selectedProject && sendMessage && inspectionMode) {
      const elementDescription = element.componentName || element.type;
      const elementText = element.componentName || 'this element';
      
      // Create a descriptive message about the clicked element
      const inspectionMessage = `I clicked on ${elementDescription}${element.selector ? ` (${element.selector})` : ''} in the preview. I want to modify or interact with this element.`;
      
      console.log('🎯 [Inspection] Auto-creating conversation message:', inspectionMessage);
      
      try {
        await sendMessage(inspectionMessage);
        console.log('✅ [Inspection] Conversation message created successfully');
      } catch (error) {
        console.error('❌ [Inspection] Failed to create conversation message:', error);
        // Fallback: still update the input field if auto-message fails
        setCurrentMessage(`Modify ${elementDescription}: `);
      }
    } else {
      // Fallback for when not in inspection mode or sendMessage unavailable
      const elementDescription = element.componentName || element.type;
      setCurrentMessage(`Modify ${elementDescription}: `);
    }
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
    console.log('🔍 Debug inspection check:', { inspectionMode, previewId: preview.id, selectedProjectId: selectedProject?.id });
    
    if (inspectionMode && preview.id) {
      console.log('🔍 Inspection mode enabled and preview.id exists, getting auth token...');
      try {
        // Get auth token for inspection route
        console.log('🔍 About to call supabase.auth.getSession()...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 getSession() completed successfully');
        console.log('🔍 Got session:', { hasSession: !!session, hasToken: !!session?.access_token });
        const authToken = session?.access_token;
        
        if (!authToken) {
          console.error('🔍 No auth token available for inspection mode');
          return baseUrl; // Fall back to normal preview
        }
        
        const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
        const inspectionUrl = `${apiUrl}/projects/${selectedProject.id}/preview/${preview.id}/inspection?token=${authToken}&path=${encodeURIComponent(currentPreviewPath)}`;
        console.log('🔍 Using server-side inspection URL with auth token and path:', currentPreviewPath);
        console.log('🔍 Full inspection URL:', inspectionUrl);
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
      
      <div className="h-screen bg-black overflow-hidden">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
        <div className="px-6 h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <CeliadorLogo size="md" variant="icon" className="hover:scale-105 transition-transform duration-200" animate />
              <span className="text-2xl font-bold text-white">Celiador</span>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-6">
              <a href="/dashboard" className="text-teal-400 font-medium px-3 py-2 text-sm">
                Dashboard
              </a>
              <a href="/solutions" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200">
                Solutions
              </a>
              <a href="/about" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200">
                About
              </a>
              <a href="/contact" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200">
                Contact
              </a>
            </nav>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800/80 transition-all"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-white hidden md:block">
                {user.name || user.email}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-300" />
            </button>
            
            {showUserMenu && (
              <div className="absolute top-12 right-0 bg-gray-800 rounded-lg shadow-lg border border-gray-600 py-2 min-w-48">
                <SettingsMenuItem />
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
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
              <span className="text-sm text-gray-300">Project:</span>
              <div className="relative" ref={projectDropdownRef}>
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-all min-w-48"
                >
                  <span className="text-sm font-medium text-white truncate">
                    {selectedProject?.name || 'Select project...'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-300 ml-auto" />
                </button>
                
                {showProjectDropdown && (
                  <div className="absolute top-12 left-0 bg-gray-800 rounded-lg shadow-lg border border-gray-600 py-2 min-w-64 z-20">
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center">
                        <button
                          onClick={() => {
                            console.log('[SimpleDashboard] Project selected:', project.name);
                            setSelectedProject(project);
                            localStorage.setItem('selectedProjectId', project.id);
                            setShowProjectDropdown(false);
                          }}
                          className={`flex-1 px-4 py-2 text-sm text-left hover:bg-gray-700 ${
                            selectedProject?.id === project.id ? 'bg-teal-600/20 text-teal-400' : 'text-gray-300'
                          }`}
                        >
                          {project.name}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowProjectMenu(showProjectMenu === project.id ? null : project.id);
                          }}
                          className="p-2 hover:bg-gray-700 rounded-md mr-2"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Project Menu */}
                    {showProjectMenu && (
                      <div className="border-t border-gray-600 mt-2 pt-2">
                        <button
                          onClick={() => {
                            const projectToDelete = projects.find(p => p.id === showProjectMenu);
                            if (projectToDelete) handleDeleteProject(projectToDelete);
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20"
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
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-sm text-sm"
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
              <div className="w-24 h-24 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <CeliadorLogo size="xl" variant="icon" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Welcome to Celiador</h1>
              <p className="text-gray-300 mb-8">
                Create your first app with AI. Ready to build truly lovable apps.
              </p>
              <button
                onClick={() => setShowCreateProject(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Create Your First App</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Workspace */
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Welcome Banner for returning users */}
            {!shouldShowOnboarding && projects.length === 0 && (
              <WelcomeBanner
                userName={user.name}
                hasCreatedFirstProject={projects.length > 0}
                hasConnectedGitHub={onboardingState.hasConnectedGitHub}
                hasDeployedProject={onboardingState.hasDeployedProject}
                onCreateProject={() => setShowCreateProject(true)}
                onDismiss={() => {}}
              />
            )}
            
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
            {/* Chat Panel - Resizable sidebar */}
            <div 
              className="w-full flex-shrink-0 flex flex-col bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden mr-2"
              style={{ width: isDesktop ? `${chatPanelWidth}px` : '100%' }}
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <CeliadorLogo size="sm" variant="icon" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">AI Assistant</h2>
                    <p className="text-teal-100 text-sm">Building {selectedProject.name}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 dark-scrollbar">
                {!messages || messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CeliadorLogo size="lg" variant="icon" />
                    </div>
                    <h3 className="font-semibold text-white mb-2">Let's build something amazing!</h3>
                    <p className="text-gray-300 text-sm">
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
                        className={`max-w-[80%] p-4 rounded-2xl break-words overflow-wrap-anywhere whitespace-pre-wrap ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                            : 'bg-gray-800/50 text-gray-100 border border-gray-700/50'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
                {isBuilding && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800/50 border border-gray-700/50 p-4 rounded-2xl flex items-center space-x-3">
                      <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
                      <span className="text-gray-100">Building your changes...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700/50">
                {/* Selected Element Indicator */}
                {selectedElement && (
                  <div className="mb-3 p-3 bg-teal-500/10 border border-teal-400/30 rounded-lg">
                    <div className="flex items-center space-x-2 text-teal-300">
                      <MousePointer className="h-4 w-4" />
                      <span className="text-sm font-medium">Selected Element:</span>
                      <code className="bg-teal-400/20 px-2 py-1 rounded text-xs">
                        {selectedElement.componentName || selectedElement.type}
                      </code>
                      <button 
                        onClick={() => setSelectedElement(null)}
                        className="ml-auto text-teal-300 hover:text-teal-100"
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
                    className="flex-1 p-3 border border-gray-600 bg-gray-800/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-400"
                    disabled={conversationLoading || isBuilding}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || conversationLoading || isBuilding}
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-3 rounded-xl hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Resize Handle */}
            <div 
              className="hidden lg:block w-2 hover:w-3 bg-gray-700 hover:bg-teal-500 cursor-ew-resize transition-all duration-200 relative group mr-2 rounded-sm"
              onMouseDown={handleMouseDown}
              title="Drag to resize AI Assistant panel"
            >
              <div className="absolute inset-y-0 -inset-x-1 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors duration-200 rounded-sm">
                <div className="flex flex-col space-y-0.5">
                  <div className="w-0.5 h-3 bg-gray-500 group-hover:bg-teal-300 rounded-full"></div>
                  <div className="w-0.5 h-3 bg-gray-500 group-hover:bg-teal-300 rounded-full"></div>
                  <div className="w-0.5 h-3 bg-gray-500 group-hover:bg-teal-300 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="flex-1 flex flex-col bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden">
              {/* Preview Header */}
              <div className="bg-gray-800/50 border-b border-gray-700/50 p-3">
                <div className="flex items-center justify-between min-h-[48px]">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <h3 className="font-semibold text-white text-sm">Live Preview</h3>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-md">
                      Your App
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Device Selector */}
                    <div className="flex bg-gray-700 rounded-lg p-1 border border-gray-600">
                      <button
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-2 rounded-md transition-all ${
                          previewDevice === 'mobile'
                            ? 'bg-gray-800 text-teal-400 shadow-sm'
                            : 'text-gray-300 hover:text-white'
                        }`}
                        title="Mobile View"
                      >
                        <Smartphone className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPreviewDevice('tablet')}
                        className={`p-2 rounded-md transition-all ${
                          previewDevice === 'tablet'
                            ? 'bg-gray-800 text-teal-400 shadow-sm'
                            : 'text-gray-300 hover:text-white'
                        }`}
                        title="Tablet View"
                      >
                        <Tablet className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-2 rounded-md transition-all ${
                          previewDevice === 'desktop'
                            ? 'bg-gray-800 text-teal-400 shadow-sm'
                            : 'text-gray-300 hover:text-white'
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
                        console.log('🚨 BUTTON CLICKED! Current inspection mode:', inspectionMode);
                        toggleInspectionMode();
                      }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                        inspectionMode 
                          ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700' 
                          : 'bg-gray-800 text-teal-400 hover:bg-gray-700 border border-teal-400/30'
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
                    
                    {/* Reset Preview Button */}
                    <button 
                      onClick={resetPreview}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600/30"
                      title="Reset Preview"
                      type="button"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Reset</span>
                    </button>
                    
                    {/* Deploy Button - Opens integrations panel */}
                    <button 
                      onClick={() => setActiveTab('integrations')}
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
                      title="Open deployment options in integrations panel"
                    >
                      <Rocket className="h-4 w-4" />
                      <span className="text-sm font-medium">Deploy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className={`flex-1 bg-white overflow-hidden ${
                previewDevice === 'desktop' ? 'p-4' : 'p-6 flex items-center justify-center'
              }`}>
                {currentPreviewUrl ? (
                  <div className={
                    previewDevice === 'desktop' 
                      ? 'w-full h-full relative bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden' 
                      : `bg-white rounded-xl shadow-xl border border-gray-300 overflow-hidden transition-all relative ${getDeviceClasses()}`
                  }>
                    {previewDevice === 'desktop' && (
                      <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 space-x-2">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-1 text-xs text-gray-600 mx-4">
                          🌐 {selectedProject?.name || 'Your App'} - Live Preview
                        </div>
                      </div>
                    )}
                    <iframe
                      ref={previewIframeRef}
                      src={currentPreviewUrl}
                      className={`w-full border-0 ${previewDevice === 'desktop' ? 'h-[calc(100%-2.5rem)]' : 'h-full'}`}
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
                      <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-teal-200">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                          </div>
                          <h4 className="font-semibold text-gray-800 mb-2">Loading Preview</h4>
                          <p className="text-gray-600 text-sm">
                            Waiting for app to render...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : preview?.status === 'starting' || preview?.status === 'syncing' || previewLoading ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">
                      {preview?.status === 'syncing' ? 'Syncing Files' : 'Starting Preview'}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {loadingMessage || preview?.status === 'syncing' ? 'Downloading project files...' : 'Setting up your app preview...'}
                    </p>
                    {loadingMessage && (
                      <p className="text-teal-400 text-xs mt-2 font-medium">
                        {loadingMessage}
                      </p>
                    )}
                  </div>
                ) : preview?.status === 'error' || previewError ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">Preview Error</h4>
                    <p className="text-gray-300 text-sm mb-4">
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
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {previewLoading ? 'Starting...' : 'Try Again'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Monitor className="h-8 w-8 text-gray-300" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">Start Preview</h4>
                    <p className="text-gray-300 text-sm mb-4">
                      Click to preview your app in the browser.
                    </p>
                    <button
                      onClick={startPreview}
                      className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-md"
                    >
                      Start Preview
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Onboarding Flow */}
      {shouldShowOnboarding && (
        <OnboardingFlow
          userName={user.name}
          onComplete={completeOnboarding}
          onCreateFirstProject={() => {
            setShowCreateProject(true);
          }}
        />
      )}

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