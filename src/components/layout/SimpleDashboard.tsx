'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CreateProjectModal } from '../project/CreateProjectModal';
import { useConversation } from '../conversation/useConversation';
import { useOfflineConversation } from '../conversation/useOfflineConversation';
import { MessageList } from '../conversation/MessageList';
import { usePreview } from '../../hooks/usePreview';
import { PreviewOverlay } from '../inspection/PreviewOverlay';
import { FloatingWindowController } from './FloatingWindowController';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';
import { WelcomeBanner } from '../onboarding/WelcomeBanner';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';
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
  RotateCcw,
  Brain,
  Zap
} from 'lucide-react';
import { SettingsMenuItem } from '../settings/SettingsPanel';
import { CeliadorLogo } from '../ui/celiador-logo';
import { OfflineStatusBanner } from '../ui/OfflineStatusIndicator';
import { AIStatusBar } from '../ecosystem/AIStatusBar';
import { ModeToggleTooltip } from '../ui/ModeToggleTooltip';
import { ConversationPanel } from '../conversation/ConversationPanel';

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
    // Enhanced context from inspection system
    parent?: {
      tagName?: string;
      className?: string;
      id?: string;
      role?: string;
      boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      styles?: Record<string, string>;
    };
    reactInfo?: {
      isNextjsComponent?: boolean;
      isTailwindStyled?: boolean;
      isCSSModules?: boolean;
      isStyledComponents?: boolean;
      possibleFramework?: string;
    };
    semantic?: {
      purpose?: string;
      actionType?: string;
      interactive?: boolean;
      formRelated?: boolean;
    };
  };
  metadata?: {
    filePath?: string;
    lineNumber?: number;
    props?: Record<string, any>;
  };
  accessibility?: {
    hasAriaLabel?: boolean;
    role?: string;
    tabIndex?: number;
    isVisible?: boolean;
    isFocusable?: boolean;
  };
}

export function SimpleDashboard({ initialUser, onLogout }: SimpleDashboardProps) {
  
  const [user] = useState<User>(initialUser);
  const { session } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
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

  // User preferences for dashboard mode
  const {
    preferences,
    isLoaded: preferencesLoaded,
    setDashboardMode,
    setAiAssistantWidth,
  } = useUserPreferences();

  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);
  const [currentPreviewPath, setCurrentPreviewPath] = useState<string>('/');
  const [inspectionSourcePath, setInspectionSourcePath] = useState<string>('/'); // Track the path when inspection was started
  const [manuallySettingUrl, setManuallySettingUrl] = useState(false); // Flag to prevent useEffect from overriding manual URL changes
  const [chatPanelWidth, setChatPanelWidth] = useState(preferences.aiAssistantWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showModeToggleTooltip, setShowModeToggleTooltip] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Handle responsive layout
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Sync preferences with local state
  useEffect(() => {
    if (preferencesLoaded) {
      setChatPanelWidth(preferences.aiAssistantWidth);
    }
  }, [preferences.aiAssistantWidth, preferencesLoaded]);

  // Save panel width changes to preferences
  useEffect(() => {
    if (preferencesLoaded && chatPanelWidth !== preferences.aiAssistantWidth) {
      const timeoutId = setTimeout(() => {
        setAiAssistantWidth(chatPanelWidth);
      }, 300); // Debounce to avoid too many saves during resize

      return () => clearTimeout(timeoutId);
    }
  }, [chatPanelWidth, preferences.aiAssistantWidth, preferencesLoaded, setAiAssistantWidth]);

  // Show mode toggle tooltip for new users
  useEffect(() => {
    if (preferencesLoaded && preferences.dashboardMode === 'classic') {
      const hasSeenTooltip = localStorage.getItem('celiador-mode-toggle-tooltip-seen');
      if (!hasSeenTooltip) {
        const timer = setTimeout(() => {
          setShowModeToggleTooltip(true);
        }, 3000); // Show after 3 seconds
        return () => clearTimeout(timer);
      }
    }
  }, [preferencesLoaded, preferences.dashboardMode]);

  const handleTooltipDismiss = () => {
    setShowModeToggleTooltip(false);
    localStorage.setItem('celiador-mode-toggle-tooltip-seen', 'true');
    // Auto-switch to AI-Enhanced mode when they dismiss the tooltip
    setDashboardMode('ai-enhanced');
  };

  // Listen for messages from same-origin preview iframe
  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENTS_MAPPED') {
        setUIElements(event.data.elements || []);
      } else if (event.data.type === 'ELEMENT_SELECTED') {
        setSelectedElement(event.data.element);
      }
    };
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

  // Use conversation hook for the selected project (with offline support)
  const USE_OFFLINE_CONVERSATION = false; // Feature flag - DISABLED: Offline system interfering with message loading
  
  const conversationHook = USE_OFFLINE_CONVERSATION 
    ? useOfflineConversation(selectedProject?.id)
    : useConversation(selectedProject?.id);
  const { 
    conversation, 
    messages, 
    sendMessage, 
    loading: conversationLoading,
    isOnline: conversationOnline,
    hasPendingMessages,
    shouldScrollToBottom
  } = conversationHook || {};


  // Auto-scroll implementation
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    };

    if (messages && messages.length > 0 && messagesContainerRef.current) {
      scrollToBottom();
      const timeouts = [
        setTimeout(scrollToBottom, 50),
        setTimeout(scrollToBottom, 200),
        setTimeout(scrollToBottom, 500),
      ];
      return () => timeouts.forEach(clearTimeout);
    }
  }, [messages?.length]);

  useEffect(() => {
    if (shouldScrollToBottom && messagesContainerRef.current && messages?.length > 0) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [shouldScrollToBottom]);

  useEffect(() => {
    if (conversation && messages && messages.length > 0 && messagesContainerRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        });
      });
    }
  }, [conversation?.id, messages?.length > 0]);
  
  // Use preview hook for the selected project
  const { preview, loading: previewLoading, error: previewError, loadingMessage, startPreview, restartPreview } = usePreview(selectedProject?.id || null);

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        // Check if session exists (useAuthenticatedFetch will handle token validation)
        if (!session) {
          console.log('[SimpleDashboard] No session available, skipping project load');
          setLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
        console.log('[SimpleDashboard] Loading projects with authenticated fetch');
        const response = await authenticatedFetch(`${apiUrl}/projects`);

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
  }, [session?.access_token]);

  // Reset iframe loaded state and preview URL when preview or project changes
  useEffect(() => {
    setIframeLoaded(false);
    setCurrentPreviewUrl(null); // Clear stale preview URL when switching projects
  }, [selectedProject?.id]); // Only depend on project ID, not preview URL to avoid loops

  // Force refresh conversation and related state when project changes
  useEffect(() => {
    if (selectedProject?.id) {
      console.log('🚀 [SimpleDashboard] *** PROJECT CHANGED IN SIMPLEDASHBOARD ***');
      console.log('🚀 [SimpleDashboard] Project changed to:', selectedProject.id, 'forcing refresh');
      console.log('🚀 [SimpleDashboard] This should trigger conversation hook with project:', selectedProject.id);
      
      // Clear conversation-related state immediately
      setCurrentMessage('');
      setSelectedElement(null);
      setSelectedFile(null);
      
      // Reset inspection and UI state
      setInspectionMode(false);
      setUIElements([]);
      
      // The conversation hook will automatically reload based on projectId dependency
    }
  }, [selectedProject?.id]);

  // Set preview URL when preview changes (but NOT when inspection mode changes)
  useEffect(() => {
    const updatePreviewUrl = async () => {
      // Skip if we're manually setting the URL to avoid race conditions
      if (manuallySettingUrl) {
        console.log('🔍 [DEBUG] Skipping URL update - manually setting URL flag is true');
        return;
      }
      
      // Skip if inspection mode is true to prevent overriding inspection URL
      if (inspectionMode) {
        console.log('🔍 [DEBUG] Skipping URL update - inspection mode is active');
        return;
      }
      
      if (preview?.status === 'running') {
        console.log('🔍 [DEBUG] Updating preview URL for normal mode');
        const url = await getPreviewUrl();
        setCurrentPreviewUrl(url);
      } else {
        setCurrentPreviewUrl(null);
      }
    };
    
    updatePreviewUrl();
  }, [preview?.url, preview?.status, preview?.id, selectedProject?.id, manuallySettingUrl]); // REMOVED inspectionMode dependency to prevent race condition

  // Add a simple fallback timer for stuck previews
  useEffect(() => {
    if (!preview || preview.status !== 'starting' && preview.status !== 'syncing') {
      return; // No need for fallback timer
    }
    
    // If preview is still starting/syncing after 30 seconds, force refresh the status
    const fallbackTimer = setTimeout(async () => {
      console.log('Preview fallback: Reloading due to stuck status');
      window.location.reload(); // Simple but effective fallback
    }, 30000); // 30 seconds

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [preview?.id, preview?.status]);


  // Listen for messages from inspection preview iframe
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      // Handle inspection element clicks from the preview server's InspectionOverlay
      if (event.data.type === 'INSPECTION_ELEMENT_CLICKED') {
        const inspectableElement = event.data.element;
        
        console.log('📨 [SimpleDashboard] Received enhanced element data:', inspectableElement);
        
        // Convert from enhanced InspectableElement to UIElement format
        const uiElement: UIElement = {
          id: inspectableElement.id,
          type: inspectableElement.type,
          selector: inspectableElement.selector,
          componentName: inspectableElement.componentName || inspectableElement.textContent || inspectableElement.type,
          text: inspectableElement.textContent,
          boundingBox: inspectableElement.boundingBox || {
            x: inspectableElement.x || 0,
            y: inspectableElement.y || 0,
            width: inspectableElement.width || 0,
            height: inspectableElement.height || 0
          },
          attributes: inspectableElement.attributes || {},
          styles: inspectableElement.styles || {},
          context: inspectableElement.context || {},
          accessibility: inspectableElement.accessibility || {}
        };
        
        console.log('✅ [SimpleDashboard] Converted to UIElement:', uiElement);
        
        handleElementSelection(uiElement);
      }
      
      // Handle navigation updates from preview iframe
      if (event.data.type === 'PREVIEW_NAVIGATION') {
        const newPath = event.data.path || '/';
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
        setCurrentPreviewPath(newPath);
      }
    };

    window.addEventListener('message', handleNavigationMessage);
    return () => window.removeEventListener('message', handleNavigationMessage);
  }, []);

  // Reset inspection mode when project changes (already handled in the combined effect above)
  // This effect is now redundant and merged into the main project change effect

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
    if (!currentMessage.trim() || !selectedProject || conversationLoading || !sendMessage) {
      return;
    }
    
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
    
    try {
      await sendMessage(enhancedMessage);
      setCurrentMessage('');
      setSelectedElement(null); // Clear selection after sending
    } catch (error) {
      console.error('Error in sendMessage:', error);
      // Show error to user
      alert('Failed to send message: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsBuilding(false);
    }
  };

  const handleProjectCreated = async (newProject: Project) => {
    console.log('🎯 [SimpleDashboard] handleProjectCreated called with:', newProject);
    console.log('🎯 [SimpleDashboard] Current projects count before update:', projects.length);
    console.log('🎯 [SimpleDashboard] newProject structure:', JSON.stringify(newProject, null, 2));
    
    // Close modal first
    setShowCreateProject(false);
    
    // Add the new project to local state
    setProjects(prev => {
      console.log('🎯 [SimpleDashboard] Previous projects:', prev.length, 'projects');
      const updated = [newProject, ...prev];
      console.log('🎯 [SimpleDashboard] Updated projects:', updated.length, 'projects');
      return updated;
    });
    
    console.log('🎯 [SimpleDashboard] Setting selected project to:', newProject.name);
    setSelectedProject(newProject);
    
    // Store the selected project in localStorage
    if (newProject.id) {
      localStorage.setItem('selectedProjectId', newProject.id);
      console.log('🎯 [SimpleDashboard] Stored project ID in localStorage:', newProject.id);
    }
    
    // Mark first project creation for onboarding
    markFirstProjectCreated();
    
    // Also refresh the projects list from the backend to ensure consistency
    try {
      console.log('🔄 [SimpleDashboard] Refreshing projects list from backend...');
      const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await authenticatedFetch(`${apiUrl}/projects`);
      
      if (response.ok) {
        const refreshedProjects = await response.json();
        console.log('🔄 [SimpleDashboard] Refreshed projects from backend:', refreshedProjects.length);
        setProjects(refreshedProjects);
        
        // Ensure the new project is still selected
        const refreshedProject = refreshedProjects.find((p: Project) => p.id === newProject.id);
        if (refreshedProject) {
          setSelectedProject(refreshedProject);
          console.log('🔄 [SimpleDashboard] Confirmed new project exists in refreshed list');
        }
      }
    } catch (error) {
      console.error('🔄 [SimpleDashboard] Failed to refresh projects list:', error);
      // Don't throw - the project was already added locally
    }
    
    console.log('🎯 [SimpleDashboard] handleProjectCreated completed');
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await authenticatedFetch(`${apiUrl}/projects/${project.id}`, {
        method: 'DELETE'
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


  const toggleInspectionMode = async () => {
    console.log('🔍 [DEBUG] toggleInspectionMode called, current mode:', inspectionMode);
    const newMode = !inspectionMode;
    console.log('🔍 [DEBUG] Switching to mode:', newMode);
    
    // When enabling inspection mode, try to get current path from tracking or iframe URL
    if (newMode) {
      // First, try using the tracked path if we have navigation tracking
      if (currentPreviewPath && currentPreviewPath !== '/') {
        // Keep the tracked path
      } else {
        
        // Try to get the current path from the iframe using postMessage
        if (previewIframeRef.current?.contentWindow) {
          try {
            // Create a promise that resolves when we get the path response
            const pathResponse = await new Promise<string>((resolve) => {
              const handlePathResponse = (event: MessageEvent) => {
                if (event.data?.type === 'CURRENT_PATH_RESPONSE') {
                  window.removeEventListener('message', handlePathResponse);
                  resolve(event.data.path || '/');
                }
              };
              
              window.addEventListener('message', handlePathResponse);
              
              // Request the current path from iframe
              previewIframeRef.current!.contentWindow!.postMessage({
                type: 'GET_CURRENT_PATH'
              }, '*');
              
              // Fallback timeout in case iframe doesn't respond
              setTimeout(() => {
                window.removeEventListener('message', handlePathResponse);
                resolve('/');
              }, 1000);
            });
            
            setCurrentPreviewPath(pathResponse);
          } catch (error) {
            console.warn('Error getting path from iframe:', error);
            setCurrentPreviewPath('/');
          }
        } else {
          setCurrentPreviewPath('/'); // Fallback to root
        }
      }
    }
    
    setInspectionMode(newMode);
    setSelectedElement(null);
  };

  const resetPreview = async () => {
    try {
      // Reset iframe state immediately
      setIframeLoaded(false);
      setCurrentPreviewUrl(null);
      
      // Turn off inspection mode if it's on
      if (inspectionMode) {
        setInspectionMode(false);
        setSelectedElement(null);
      }
      
      // Reset to root path
      setCurrentPreviewPath('/');
      setInspectionSourcePath('/');
      
      // Clear the backend's tracked last path
      if (preview && selectedProject && session?.access_token) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
          await fetch(`${apiUrl}/projects/${selectedProject.id}/preview/${preview.id}/set-path`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: '/' })
          });
          console.log('🔄 [Reset Preview] Backend path reset to /');
        } catch (error) {
          console.error('Error resetting backend path:', error);
          // Continue with frontend reset even if backend call fails
        }
      }
      
      // If preview is stuck in syncing/starting state, try to stop and restart it
      if (preview && selectedProject && (preview.status === 'syncing' || preview.status === 'starting')) {
        try {
          // Stop the current preview
          await stopPreview();
          
          // Wait a moment, then start a new preview
          setTimeout(async () => {
            await startPreview();
          }, 1000);
        } catch (error) {
          console.error('Error force restarting preview:', error);
          // Fall back to just refreshing the URL at root path
          setTimeout(async () => {
            if (preview?.status === 'running') {
              const url = await getPreviewUrl();
              setCurrentPreviewUrl(url);
            }
          }, 100);
        }
      } else {
        // For running previews or no preview, refresh the URL at root path
        setTimeout(async () => {
          if (preview?.status === 'running') {
            const url = await getPreviewUrl();
            setCurrentPreviewUrl(url);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error resetting preview:', error);
    }
  };

  const handleElementSelection = async (element: UIElement) => {
    setSelectedElement(element);
    
    // Create an automatic conversation message when an element is clicked in inspection mode
    if (selectedProject && sendMessage && inspectionMode) {
      const elementDescription = element.componentName || element.type;
      
      // Create a descriptive message about the clicked element
      const inspectionMessage = `I clicked on ${elementDescription}${element.selector ? ` (${element.selector})` : ''} in the preview. I want to modify or interact with this element.`;
      
      try {
        await sendMessage(inspectionMessage);
      } catch (error) {
        console.error('Failed to create conversation message:', error);
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
    if (!preview || preview.status !== 'running' || !selectedProject) {
      return null;
    }
    
    const baseUrl = preview.url;
    
    // If inspection mode is enabled, use the server-side inspection route
    if (inspectionMode && preview.id) {
      try {
        // Get auth token for inspection route
        const authToken = session?.access_token;
        
        if (!authToken) {
          console.error('No auth token available for inspection mode');
          return baseUrl; // Fall back to normal preview
        }
        
        // Determine the correct API URL based on environment (same logic as PreviewFrame)
        let apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL;
        
        if (!apiUrl) {
          // Auto-detect based on environment
          if (typeof window !== 'undefined') {
            // In browser - check if we're on Vercel or local
            if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('celiador.ai')) {
              apiUrl = 'https://celiador-unified-production.up.railway.app';
            } else {
              apiUrl = 'http://localhost:4000';
            }
          } else {
            // On server - default to localhost for SSR
            apiUrl = 'http://localhost:4000';
          }
        }
        
        // Pass the captured path to the inspection endpoint
        // Add cache-busting timestamp to force fresh inspection load
        const timestamp = Date.now();
        const inspectionUrl = `${apiUrl}/projects/${selectedProject.id}/preview/${preview.id}/inspection?token=${authToken}&path=${encodeURIComponent(inspectionSourcePath)}&_t=${timestamp}`;
        return inspectionUrl;
      } catch (error) {
        console.error('Error getting auth token for inspection:', error);
        return baseUrl; // Fall back to normal preview
      }
    }
    
    // Normal mode: add authentication to proxy URL and preserve current path
    try {
      const authToken = session?.access_token;
      
      if (!authToken) {
        console.error('No auth token available for normal preview');
        return null;
      }
      
      // When exiting inspection mode, get the current path from backend tracking
      let targetUrl = baseUrl;
      
      try {
        // Get the last accessed path from backend
        const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
        const lastPathResponse = await fetch(`${apiUrl}/projects/${selectedProject.id}/preview/${preview.id}/last-path`);
        if (lastPathResponse.ok) {
          const { path } = await lastPathResponse.json();
          
          if (path && path !== '/') {
            // baseUrl already ends with /proxy, so just append the path
            targetUrl = `${baseUrl}${path}`;
          }
        }
      } catch (error) {
        // Fallback to base URL if path request fails
      }
      
      const urlWithAuth = `${targetUrl}?token=${encodeURIComponent(authToken)}`;
      return urlWithAuth;
    } catch (error) {
      console.error('Error getting auth token for normal preview:', error);
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
              <div className="flex items-center space-x-2 text-teal-400 font-medium px-3 py-2 text-sm">
                <span>Dashboard</span>
                {preferences.dashboardMode === 'ai-enhanced' && (
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
                    <span className="text-xs text-teal-300">AI Enhanced</span>
                  </div>
                )}
              </div>
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

          {/* Dashboard Mode Toggle */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-gray-800/40 rounded-lg p-1 relative">
              <button
                onClick={() => setDashboardMode('classic')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  preferences.dashboardMode === 'classic'
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
                title="Classic Dashboard Mode"
              >
                <Monitor className="w-4 h-4" />
                <span>Classic</span>
              </button>
              <button
                onClick={() => setDashboardMode('ai-enhanced')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  preferences.dashboardMode === 'ai-enhanced'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
                title="AI-Enhanced Dashboard Mode"
              >
                <Brain className="w-4 h-4" />
                <span>AI Enhanced</span>
                <Zap className="w-3 h-3" />
              </button>
              
              {/* New Feature Tooltip */}
              <ModeToggleTooltip 
                isVisible={showModeToggleTooltip}
                onDismiss={handleTooltipDismiss}
              />
            </div>

            {/* Mobile Mode Toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setDashboardMode(preferences.dashboardMode === 'classic' ? 'ai-enhanced' : 'classic')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  preferences.dashboardMode === 'ai-enhanced'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white'
                    : 'bg-gray-800/60 text-gray-300'
                }`}
                title={`Switch to ${preferences.dashboardMode === 'classic' ? 'AI-Enhanced' : 'Classic'} Mode`}
              >
                {preferences.dashboardMode === 'classic' ? (
                  <>
                    <Monitor className="w-4 h-4" />
                    <span>Classic</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <Zap className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
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

      {/* AI Ecosystem Status Bar */}
      <AIStatusBar 
        projectId={selectedProject?.id} 
        userId={user.id}
        className="border-b border-gray-700/50"
      />

      {/* Main Content */}
      <div className="p-6 flex flex-col h-[calc(100vh-8rem)]">
        {/* Offline Status Banner */}
        <OfflineStatusBanner className="mb-4" />
        
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
            
            <div className="flex-1 min-h-0 max-h-full flex flex-col lg:flex-row">
            {/* AI Assistant Panel - Conditional based on dashboard mode */}
            <div 
              className="w-full flex-shrink-0 flex flex-col bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden mr-2 h-full"
              style={{ width: isDesktop ? `${chatPanelWidth}px` : '100%' }}
            >
              {preferences.dashboardMode === 'ai-enhanced' ? (
                /* AI Enhanced Mode - Conversation Panel with Header */
                <>
                  {/* Chat Header */}
                  <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4">
                    <div className="flex items-center justify-between">
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
                  </div>

                  {/* Conversation Panel */}
                  <div className="flex-1 overflow-hidden">
                    <ConversationPanel 
                      selectedProject={selectedProject}
                      projectId={selectedProject?.id} 
                      className="h-full" 
                      embedded={true}
                      selectedElement={selectedElement}
                      inspectionMode={inspectionMode}
                      onClearSelectedElement={() => setSelectedElement(null)}
                    />
                  </div>
                </>
              ) : (
                /* Classic Mode - Basic Chat Interface */
                <>
                  {/* Chat Header */}
                  <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <CeliadorLogo size="sm" variant="icon" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-lg">AI Assistant</h2>
                          <p className="text-teal-100 text-sm">Building {selectedProject.name}</p>
                        </div>
                      </div>
                      {USE_OFFLINE_CONVERSATION && (
                        <div className="flex items-center space-x-2">
                          {conversationOnline ? (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                              <span className="text-xs text-teal-100">Online</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                              <span className="text-xs text-teal-100">Offline</span>
                            </div>
                          )}
                          {hasPendingMessages && (
                            <div className="bg-orange-200/20 text-orange-100 px-2 py-1 rounded-full text-xs">
                              Syncing...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages using MessageList component for consistency */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-hidden">
                    <MessageList
                      messages={messages || []}
                      loading={conversationLoading || isBuilding}
                      shouldScrollToBottom={true}
                      className="h-full"
                    />
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-gray-700 p-4 bg-gray-800/30 backdrop-blur-sm">
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
                    
                    <div className="flex gap-2">
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
                        className="flex-1 bg-gray-800/80 border border-gray-600 hover:border-teal-500/50 text-white placeholder-gray-400 transition-all duration-300 focus:border-teal-400 focus:shadow-teal-400/20 backdrop-blur-sm p-3 rounded-xl focus:outline-none"
                        disabled={conversationLoading || isBuilding}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim() || conversationLoading || isBuilding}
                        className="bg-teal-600 hover:bg-teal-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-teal-500/30 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {conversationLoading || isBuilding ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
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
            <div className="flex-1 flex flex-col bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50 overflow-hidden h-full">
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
                      onClick={async (e) => {
                        e.preventDefault();
                        
                        // Prevent race conditions during the operation
                        setManuallySettingUrl(true);
                        
                        if (!inspectionMode) {
                          // ENTERING inspection mode - Let backend determine current path
                          setInspectionSourcePath('');
                          
                          // Set inspection mode
                          setInspectionMode(true);
                          setSelectedElement(null);
                          
                          // Generate inspection URL with the captured path
                          if (preview && selectedProject) {
                            try {
                              const authToken = session?.access_token;
                              if (authToken) {
                                let apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
                                // Don't pass path parameter - let backend use its tracking
                                // Add cache-busting timestamp to force iframe reload
                                const timestamp = Date.now();
                                const inspectionUrl = `${apiUrl}/projects/${selectedProject.id}/preview/${preview.id}/inspection?token=${authToken}&_t=${timestamp}`;
                                console.log('🔍 [DEBUG] Setting inspection URL:', inspectionUrl);
                                console.log('🔍 [DEBUG] Previous URL was:', currentPreviewUrl);
                                setCurrentPreviewUrl(inspectionUrl);
                                console.log('🔍 [DEBUG] Inspection URL set, should reload iframe');
                                
                                // Verify URL change after a short delay
                                setTimeout(() => {
                                  console.log('🔍 [DEBUG] Current preview URL after change:', currentPreviewUrl);
                                  const iframe = document.querySelector('iframe');
                                  console.log('🔍 [DEBUG] Actual iframe src:', iframe?.src);
                                }, 100);
                              }
                            } catch (error) {
                              console.error('Error getting auth token:', error);
                            }
                          }
                        } else {
                          // EXITING inspection mode
                          setInspectionMode(false);
                          setSelectedElement(null);
                          
                          // Get normal preview URL
                          const url = await getPreviewUrl();
                          if (url) {
                            setCurrentPreviewUrl(url);
                          }
                        }
                        
                        // Clear manual flag after operation
                        setTimeout(() => {
                          setManuallySettingUrl(false);
                        }, 100);
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
                        setTimeout(() => {
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