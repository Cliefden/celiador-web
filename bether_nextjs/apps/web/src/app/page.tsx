
'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/sidebar';
import { ProjectView } from '../components/project/project-view';
import { CreateProjectModal } from '../components/modals/create-project-modal';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Project {
  id: string;
  name: string;
  templatekey: string;
  repoprovider: string;
  repoowner: string;
  reponame: string;
  status: string;
  createdat: string;
  updatedat: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name
        });
        fetchProjects(session.access_token);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user && data.session) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name
        });
        fetchProjects(data.session.access_token);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: email.split('@')[0] }
        }
      });

      if (error) throw error;

      if (data.user && data.session) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name
        });
        fetchProjects(data.session.access_token);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProjects([]);
      setSelectedProject(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchProjects = async (accessToken?: string) => {
    try {
      const response = await fetch('http://localhost:4000/projects', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleCreateProject = async (projectData: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('http://localhost:4000/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects([newProject, ...projects]);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Supabase Setup Required</h1>
          <p className="text-gray-600 mb-4">
            Please configure your Supabase environment variables in <code>.env.local</code>
          </p>
          <div className="bg-gray-100 p-4 rounded text-left text-sm">
            <p><strong>NEXT_PUBLIC_SUPABASE_URL</strong>=https://your-project.supabase.co</p>
            <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong>=your_anon_key</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h1>
          
          <form onSubmit={isLogin ? handleLogin : handleRegister}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
          
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-4 text-blue-500 hover:underline"
          >
            {isLogin ? 'Need an account? Sign up' : 'Have an account? Sign in'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        projects={projects}
        selectedProject={selectedProject}
        onProjectSelect={(project) => setSelectedProject(project)}
        onCreateProject={() => setIsModalOpen(true)}
        user={user}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 overflow-auto">
        {selectedProject ? (
          <ProjectView project={selectedProject} userId={user.id} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Welcome to Bether</h2>
              <p className="text-gray-600 mb-4">Select a project or create a new one to get started</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Create Project
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
