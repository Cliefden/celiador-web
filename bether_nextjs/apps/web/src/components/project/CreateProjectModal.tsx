'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Plus, Github, Gitlab, Code, Sparkles, Zap, Palette, ShoppingCart, MessageSquare, BarChart3, Globe, Briefcase, Rocket } from 'lucide-react';
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

interface Template {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  features: string[];
  isActive: boolean;
  version: string;
}

export function CreateProjectModal({ isOpen, onClose, onProjectCreated, userId }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [templateKey, setTemplateKey] = useState('next-saas-starter');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Fetch templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const response = await fetch('http://localhost:4000/templates');
        
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
          
          // Set default template if none selected
          if (data.templates && data.templates.length > 0 && !templateKey) {
            setTemplateKey(data.templates[0].key);
          }
        } else {
          console.error('Failed to fetch templates:', response.status);
          // Fallback to hardcoded templates if API fails
          setTemplates([
            {
              key: 'next-saas-starter',
              name: '🚀 Next.js SaaS Starter',
              description: 'Complete SaaS boilerplate with payments, auth, and dashboard',
              icon: 'Rocket',
              color: 'from-purple-600 to-blue-600',
              category: 'saas',
              features: ['Stripe', 'Auth', 'Dashboard', 'Responsive'],
              isActive: true,
              version: '1.0.0'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        // Fallback to hardcoded templates
        setTemplates([
          {
            key: 'next-saas-starter',
            name: '🚀 Next.js SaaS Starter',
            description: 'Complete SaaS boilerplate with payments, auth, and dashboard',
            icon: 'Rocket',
            color: 'from-purple-600 to-blue-600',
            category: 'saas',
            features: ['Stripe', 'Auth', 'Dashboard', 'Responsive'],
            isActive: true,
            version: '1.0.0'
          }
        ]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, templateKey]);

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
        setTemplateKey('next-saas-starter');
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

  // Map icon names to React components
  const getTemplateIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Sparkles': <Sparkles className="w-5 h-5" />,
      'ShoppingCart': <ShoppingCart className="w-5 h-5" />,
      'MessageSquare': <MessageSquare className="w-5 h-5" />,
      'BarChart3': <BarChart3 className="w-5 h-5" />,
      'Palette': <Palette className="w-5 h-5" />,
      'Briefcase': <Briefcase className="w-5 h-5" />,
      'Globe': <Globe className="w-5 h-5" />,
      'Zap': <Zap className="w-5 h-5" />,
      'Rocket': <Rocket className="w-5 h-5" />,
      'Code': <Code className="w-5 h-5" />
    };
    
    return iconMap[iconName] || <Code className="w-5 h-5" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Project
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Deploy your idea in minutes, not hours
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-white/50"
            disabled={isSubmitting}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Project Details */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Details</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Give your project a name and connect it to your GitHub repository
                </p>
              </div>
              <div className="grid gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-muted-foreground mb-2">
                    Project Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="my-awesome-project"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="repoOwner" className="block text-xs font-medium text-muted-foreground mb-2">
                      GitHub Username
                    </label>
                    <Input
                      id="repoOwner"
                      value={repoOwner}
                      onChange={(e) => setRepoOwner(e.target.value)}
                      placeholder="username"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="repoName" className="block text-xs font-medium text-muted-foreground mb-2">
                      Repository Name
                    </label>
                    <Input
                      id="repoName"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      placeholder="my-project"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Choose Your Template</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Start with a professionally crafted template to accelerate your development
                </p>
              </div>
              <div className="grid gap-3 max-h-64 overflow-y-auto pr-2">
                {loadingTemplates ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading templates...
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No templates available
                  </div>
                ) : (
                  templates.map((template) => (
                    <div
                      key={template.key}
                      className={`relative border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        templateKey === template.key
                          ? 'border-primary bg-gradient-to-r ' + template.color + ' text-white shadow-lg'
                          : 'border-muted hover:border-muted-foreground/30 bg-white'
                      }`}
                      onClick={() => setTemplateKey(template.key)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getTemplateIcon(template.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold mb-1">{template.name}</h3>
                          <p className={`text-xs mb-3 ${
                            templateKey === template.key ? 'text-white/90' : 'text-muted-foreground'
                          }`}>
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {template.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-full ${
                                  templateKey === template.key
                                    ? 'bg-white/20 text-white'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            templateKey === template.key
                              ? 'border-white bg-white'
                              : 'border-muted-foreground/30'
                          }`}>
                            {templateKey === template.key && (
                              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name || !repoOwner || !repoName}
                className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
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