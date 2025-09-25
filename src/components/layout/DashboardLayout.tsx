'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ApiClient } from '../../lib/api';
import { ProjectSidebar } from './ProjectSidebar';
import { ContextBar } from './ContextBar';
import { ConversationWorkspace } from './ConversationWorkspace';
import { ActivityStream } from './ActivityStream';
import { CreateProjectModal } from '../project/CreateProjectModal';
import { FloatingWindowController } from './FloatingWindowController';
import { useConversation } from '../conversation/useConversation';

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

interface Conversation {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  userId: string;
}

interface DashboardLayoutProps {
  initialUser: User;
  onLogout: () => void;
}

export function DashboardLayout({ initialUser, onLogout }: DashboardLayoutProps) {
  const [user] = useState<User>(initialUser);
  const [projects, setProjects] = useState<Project[]>([]);
  // Initialize selectedProject from localStorage if available
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedProjectId');
      // We'll set the actual project object after loading projects
      return saved ? { id: saved } as Project : null;
    }
    return null;
  });
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Use conversation hook for the selected project
  const { conversation, messages, createConversation } = useConversation(selectedProject?.id);

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[dashboard] No session available');
          return;
        }

        console.log('[dashboard] Loading projects...');
        const projectsData = await ApiClient.getProjects();
        console.log('[dashboard] Projects loaded:', projectsData.length);
        setProjects(projectsData);
        
        // Try to restore selected project from localStorage
        const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('selectedProjectId') : null;
        if (savedProjectId && projectsData.length > 0) {
          const savedProject = projectsData.find(p => p.id === savedProjectId);
          if (savedProject) {
            console.log('[dashboard] Restored selected project from localStorage:', savedProject.name);
            setSelectedProject(savedProject);
            return; // Exit early, don't auto-select first project
          } else {
            console.log('[dashboard] Saved project not found, clearing localStorage');
            localStorage.removeItem('selectedProjectId');
          }
        }
          
        // Auto-select first project if none selected and no saved selection
        if (projectsData.length > 0 && !selectedProject) {
          console.log('[dashboard] Auto-selecting first project:', projectsData[0].name);
          setSelectedProject(projectsData[0]);
          localStorage.setItem('selectedProjectId', projectsData[0].id);
        }
      } catch (error) {
        console.error('[dashboard] Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []); // Remove selectedProject dependency to prevent re-renders

  // Auto-create conversation only if no conversations exist for the project
  useEffect(() => {
    const initializeConversation = async () => {
      if (selectedProject && !conversation) {
        try {
          // Check if ANY conversations exist for this project first
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;

          const { data: existingConversations } = await supabase
            .from('conversations')
            .select('id')
            .eq('projectid', selectedProject.id)
            .eq('userid', session.user.id)
            .eq('status', 'ACTIVE');

          // Only create if no conversations exist at all
          if (!existingConversations || existingConversations.length === 0) {
            console.log('[dashboard] Creating initial conversation for project:', selectedProject.name);
            await createConversation(`Chat with ${selectedProject.name}`);
          } else {
            console.log('[dashboard] Conversations already exist, not creating new one');
          }
        } catch (error) {
          console.error('Failed to create initial conversation:', error);
        }
      }
    };

    // Only initialize conversation if we have a selected project and no conversation yet
    if (selectedProject) {
      initializeConversation();
    }
  }, [selectedProject?.id]); // Only depend on project ID to prevent over-firing

  const handleProjectSelect = (project: Project) => {
    console.log('[dashboard] Project selected:', project.name);
    setSelectedProject(project);
    // Persist selection in localStorage
    localStorage.setItem('selectedProjectId', project.id);
  };

  const handleCreateProject = () => {
    setShowCreateProject(true);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject);
    setShowCreateProject(false);
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[dashboard] No session available for delete operation');
        return;
      }

      console.log('[dashboard] Deleting project:', project.name);
      
      await ApiClient.deleteProject(project.id);
      console.log('[dashboard] Project deleted successfully');
      
      // Remove project from state
      setProjects(prev => prev.filter(p => p.id !== project.id));
      
      // If this was the selected project, clear selection and localStorage
      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
        localStorage.removeItem('selectedProjectId');
      }
    } catch (error) {
      console.error('[dashboard] Error deleting project:', error);
      alert('An error occurred while deleting the project.');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality across files and conversations
  };

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    console.log('[dashboard] File selected:', filePath);
    // TODO: Open file in editor or show file details
  };

  // Transform conversation for ContextBar
  const contextBarConversation: Conversation | null = conversation ? {
    id: conversation.id,
    title: conversation.title,
    status: conversation.status,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    projectId: conversation.projectId,
    userId: conversation.userId
  } : null;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
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
      
      <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Celiador Studio
                </span>
              </div>
              
              {/* Dashboard Navigation */}
              <nav className="hidden md:flex space-x-6">
                <a href="/dashboard" className="text-blue-600 font-medium px-3 py-2 text-sm">
                  Dashboard
                </a>
                <a href="/dashboard/jobs" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200">
                  Jobs
                </a>
                <a href="/solutions" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200">
                  Solutions
                </a>
                <a href="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200">
                  About Us
                </a>
                <a href="/contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200">
                  Contact
                </a>
              </nav>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {user.name || user.email}
                </p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Project Sidebar */}
        <ProjectSidebar
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={handleProjectSelect}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          user={user}
          onLogout={onLogout}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Context Bar */}
          <ContextBar
            selectedProject={selectedProject}
            conversation={contextBarConversation}
            onSearch={handleSearch}
          />

          {/* Main Workspace */}
          <div className="flex-1 flex overflow-hidden">
          {selectedProject ? (
            <>
              {/* Conversation & File Workspace */}
              <div className="flex-1 overflow-hidden">
                <ConversationWorkspace selectedProject={selectedProject} />
              </div>

              {/* Activity Stream - Fixed width sidebar on the right */}
              <div className="w-80 flex flex-col">
                <ActivityStream 
                  selectedProject={selectedProject} 
                  className="flex-1 min-h-0"
                />
              </div>
            </>
          ) : (
            /* No Project Selected State */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold mb-2">Welcome to Celiador Studio</h2>
                <p className="text-muted-foreground mb-6">
                  Create your first project to start building with AI-powered development tools.
                </p>
                <button
                  onClick={handleCreateProject}
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Project
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
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
      </div>
    </>
  );
}