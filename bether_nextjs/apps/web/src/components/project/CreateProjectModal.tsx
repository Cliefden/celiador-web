'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Plus, Github, Gitlab, Code } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
  userId: string;
}

export function CreateProjectModal({ isOpen, onClose, onProjectCreated, userId }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [templateKey, setTemplateKey] = useState('next-prisma-supabase');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      // Transform the data to match what the orchestrator expects
      const projectData = {
        name,
        templateKey,
        repo: {
          provider: 'github',
          owner: repoOwner,
          name: repoName
        },
        userId
      };

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
        onProjectCreated(newProject);
        
        // Clear fields
        setName('');
        setRepoOwner('');
        setRepoName('');
        setTemplateKey('next-prisma-supabase');
        onClose();
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to create project: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      setError(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const templates = [
    {
      key: 'next-prisma-supabase',
      name: 'Next.js + Prisma + Supabase',
      description: 'Full-stack React app with database and auth',
      icon: <Code className="w-5 h-5" />
    },
    {
      key: 'react-vite',
      name: 'React + Vite',
      description: 'Fast React development setup',
      icon: <Code className="w-5 h-5" />
    },
    {
      key: 'node-express',
      name: 'Node.js + Express',
      description: 'RESTful API with Express',
      icon: <Code className="w-5 h-5" />
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Create New Project</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {/* Project Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Project"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Repository Details */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Repository Details</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Repository Owner</label>
                  <Input
                    type="text"
                    value={repoOwner}
                    onChange={(e) => setRepoOwner(e.target.value)}
                    placeholder="username"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Repository Name</label>
                  <Input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="my-project"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Project Template</label>
              <div className="grid gap-3">
                {templates.map((template) => (
                  <div
                    key={template.key}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      templateKey === template.key
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                    onClick={() => setTemplateKey(template.key)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium">{template.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          templateKey === template.key
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/30'
                        }`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim() || !repoOwner.trim() || !repoName.trim()}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Create Project</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}