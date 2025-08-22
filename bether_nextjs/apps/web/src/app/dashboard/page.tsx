'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

// Import the existing dashboard components
import { Sidebar } from '../../components/layout/sidebar';
import { ProjectView } from '../../components/project/project-view';
import { CreateProjectModal } from '../../components/modals/create-project-modal';
import { JobLogs } from '../../components/jobs/job-logs';

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
  creator?: string;
  updater?: string;
  deleter?: string;
  deletedAt?: string;
}

export default function DashboardPage() {
  const { user, profile, isLoading, signOut, refreshAuth } = useAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Fetch projects when user is authenticated
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      // Get the current session to access the token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No access token available');
        return;
      }

      const response = await fetch('http://localhost:4000/projects', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0]);
        }
      } else {
        console.error('Failed to fetch projects:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleCreateProject = async (projectData: any) => {
    try {
      // Get the current session to access the token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No access token available');
        throw new Error('No access token available');
      }

      // Transform the data to match what the orchestrator expects
      const transformedData = {
        name: projectData.name,
        templateKey: projectData.templateKey,
        repo: {
          provider: projectData.repo.provider,
          owner: projectData.repo.owner,
          name: projectData.repo.name
        },
        userId: user?.id
      };

      const response = await fetch('http://localhost:4000/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(transformedData)
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects(prev => [...prev, newProject]);
        setSelectedProject(newProject);
        setIsCreateModalOpen(false);
      } else {
        const errorText = await response.text();
        console.error('Failed to create project:', response.status, response.statusText, errorText);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        throw new Error(`Failed to create project: ${response.status} ${response.statusText}: ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error; // Re-throw so the modal can handle it
    }
  };

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    setIsSigningOut(true);
    try {
      console.log('Dashboard: Starting logout...');
      await signOut();
      // signOut now handles the redirect, so we don't need router.push
    } catch (error) {
      console.error('Dashboard: Logout error:', error);
      setIsSigningOut(false);
      // Force refresh as fallback
      window.location.href = '/';
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Render the dashboard for authenticated users
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Bether Studio
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
                  {profile?.full_name || profile?.username || user.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {profile?.role || 'user'}
                </p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {(profile?.full_name || profile?.username || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={refreshAuth}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                title="Refresh authentication state"
              >
                ↻
              </button>
              <button
                onClick={handleLogout}
                disabled={isSigningOut}
                className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar 
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
          onCreateProject={() => setIsCreateModalOpen(true)}
          user={{
            id: user.id,
            email: user.email || '',
            name: profile?.full_name || profile?.username
          }}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            <div className="container mx-auto px-6 py-8">
              
              {selectedProject ? (
                <ProjectView 
                  project={selectedProject}
                  userId={user.id}
                  onProjectDeleted={(projectId) => {
                    setProjects(prev => prev.filter(p => p.id !== projectId));
                    setSelectedProject(null);
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Select a project to get started</p>
                </div>
              )}
              
              {selectedProject && (
                <JobLogs 
                  projectId={selectedProject.id}
                  jobId=""
                  isRunning={false}
                  onStart={() => {}}
                  onStop={() => {}}
                />
              )}
              
              <CreateProjectModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateProject}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
