'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Plus, Code, Sparkles, Zap, Palette, ShoppingCart, MessageSquare, BarChart3, Globe, Briefcase, Rocket } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ApiClient } from '../../lib/api';

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
  id: string;
  template_key: string;
  name: string;
  description: string;
  long_description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
  emoji: string;
  color_primary: string;
  color_secondary?: string;
  rating: number;
  version: string;
  storage_path: string;
  is_active: boolean;
  sort_order: number;
  categories: Array<{
    id: string;
    key: string;
    name: string;
    icon: string;
    color_primary: string;
    is_primary_category: boolean;
  }>;
  features: Array<{
    id: string;
    name: string;
    description?: string;
    icon?: string;
    category?: string;
    is_core_feature: boolean;
  }>;
  tech_stack: Array<{
    id: string;
    name: string;
    description?: string;
    icon?: string;
    category?: string;
    website_url?: string;
    is_primary_tech: boolean;
  }>;
}

export function CreateProjectModal({ isOpen, onClose, onProjectCreated, userId }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [templateKey, setTemplateKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  
  // Add authentication check
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Ref to maintain scroll position
  const templateScrollRef = useRef<HTMLDivElement>(null);
  
  // Handle template selection with scroll position preservation
  const handleTemplateSelect = (selectedTemplateKey: string) => {
    // Store current scroll position
    const currentScrollTop = templateScrollRef.current?.scrollTop || 0;
    
    // Update template selection
    setTemplateKey(selectedTemplateKey);
    
    // Restore scroll position after re-render
    setTimeout(() => {
      if (templateScrollRef.current) {
        templateScrollRef.current.scrollTop = currentScrollTop;
      }
    }, 0);
  };

  // Check authentication when modal opens
  useEffect(() => {
    const checkAuth = async () => {
      if (!isOpen) {
        setIsAuthChecking(false);
        return;
      }
      
      setIsAuthChecking(true);
      setError(''); // Clear any previous errors
      
      try {
        console.log('CreateProjectModal: Checking authentication...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('CreateProjectModal: Auth check result:', { 
          hasSession: !!session, 
          hasUser: !!session?.user, 
          error: error?.message 
        });
        
        if (error) {
          console.error('CreateProjectModal: Session error:', error);
          setError('Authentication error. Please refresh the page and try again.');
          setIsAuthChecking(false);
          return;
        }
        
        if (!session || !session.user) {
          console.log('CreateProjectModal: No session found');
          setError('You must be signed in to create a project. Please sign in and try again.');
          setIsAuthChecking(false);
          return;
        }
        
        console.log('CreateProjectModal: Authentication successful');
        setIsAuthChecking(false);
      } catch (error) {
        console.error('CreateProjectModal: Auth check failed:', error);
        setError('Authentication check failed. Please refresh the page and try again.');
        setIsAuthChecking(false);
      }
    };

    // Add timeout to prevent infinite checking
    const timeoutId = setTimeout(() => {
      console.log('CreateProjectModal: Auth check timeout reached');
      setError('Authentication check timed out. Please close the modal and try again.');
      setIsAuthChecking(false);
    }, 5000);

    checkAuth().then(() => {
      clearTimeout(timeoutId);
    }).catch(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isOpen]);

  // Fetch templates from Supabase
  useEffect(() => {
    const fetchTemplates = async () => {
      if (isAuthChecking) return; // Don't fetch templates until auth is checked
      
      try {
        setLoadingTemplates(true);
        
        // Fetch templates from orchestrator API
        const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/templates`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }

        const templatesData = await response.json();
        const orchestratorTemplates = templatesData.templates || [];

        // Transform orchestrator template format to expected frontend format
        const transformedTemplates = orchestratorTemplates.map((template: any) => ({
          id: template.template_key || template.key,
          template_key: template.template_key || template.key,
          name: template.name,
          description: template.description,
          long_description: template.long_description || template.description,
          difficulty: template.difficulty || 'intermediate',
          icon: template.icon,
          emoji: template.emoji,
          color_primary: template.color_primary || '#3B82F6',
          color_secondary: template.color_secondary || '#8B5CF6',
          rating: template.rating || 0,
          version: template.version || '1.0.0',
          storage_path: template.storage_path || template.key,
          is_active: template.is_active !== undefined ? template.is_active : true,
          sort_order: template.sort_order || 0,
          categories: template.categories || [],
          features: template.features || [],
          tech_stack: template.tech_stack || []
        }));

        setTemplates(transformedTemplates);
        
        // Set default template if none selected
        if (transformedTemplates.length > 0 && !templateKey) {
          setTemplateKey(transformedTemplates[0].template_key);
        }
        
      } catch (error) {
        console.error('Error fetching templates:', error);
        // Fallback to empty array on error
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };

    if (isOpen && !isAuthChecking && templates.length === 0) {
      fetchTemplates();
    }
  }, [isOpen, isAuthChecking, templates.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error('Please sign in to create a project');
      }
      
      if (!session.access_token) {
        throw new Error('Invalid authentication session. Please sign in again.');
      }

      // Transform the data to match what the orchestrator expects
      const projectData = {
        name,
        templateKey,
        userId
      };

      console.log('🚀 [CreateProjectModal] Sending project creation request:', projectData);
      
      const newProject = await Promise.race([
        ApiClient.createProject(projectData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 60 seconds. Please try again.')), 60000)
        )
      ]);
      
      console.log('✅ [CreateProjectModal] Project created successfully:', newProject);
      onProjectCreated(newProject);
      
      // Clear fields
      setName('');
      setTemplateKey('');
      onClose();
    } catch (error) {
      console.error('❌ [CreateProjectModal] Failed to create project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      setError(`Project creation failed: ${errorMessage}`);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] min-h-[600px] flex flex-col bg-white shadow-2xl border-0 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Project
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Deploy your idea in minutes, connect to GitHub later
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
        <CardContent className="flex-1 overflow-y-auto space-y-6 bg-white">
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
                  Give your project a name to get started
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
                    placeholder="My Awesome Project"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Choose Your Template</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Start with a template or begin with a minimal Next.js setup
                </p>
              </div>
              

              <div className="flex-1 min-h-0 border border-gray-100 rounded-lg overflow-hidden">
                <div ref={templateScrollRef} className="h-full overflow-y-auto p-3">
                  {isAuthChecking ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p>Checking authentication...</p>
                      </div>
                    </div>
                  ) : loadingTemplates ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p>Loading templates...</p>
                      </div>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      <p>No templates available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {templates.map((template) => (
                    <div
                      key={template.template_key}
                      className={`relative border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        templateKey === template.template_key
                          ? 'border-white/30 text-white shadow-lg ring-2 ring-white/50'
                          : 'border-white/20 text-white hover:border-white/40 hover:shadow-lg'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${template.color_primary}, ${template.color_secondary || template.color_primary})`
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleTemplateSelect(template.template_key);
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <span className="text-lg">{template.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold">{template.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              templateKey === template.template_key
                                ? 'bg-white/30 text-white'
                                : 'bg-white/20 text-white'
                            }`}>
                              {template.difficulty}
                            </span>
                            {template.rating > 0 && (
                              <span className="text-xs text-white/90">
                                ⭐ {template.rating}
                              </span>
                            )}
                          </div>
                          <p className="text-xs mb-3 text-white/90">
                            {template.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                templateKey === template.template_key
                                  ? 'bg-white/30 text-white'
                                  : 'bg-white/20 text-white'
                              }`}
                            >
                              {template.difficulty}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                templateKey === template.template_key
                                  ? 'bg-white/30 text-white'
                                  : 'bg-white/20 text-white'
                              }`}
                            >
                              v{template.version}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            templateKey === template.template_key
                              ? 'border-white bg-white'
                              : 'border-white/40'
                          }`}>
                            {templateKey === template.template_key && (
                              <div className="w-2 h-2 rounded-full" style={{
                                background: `linear-gradient(45deg, ${template.color_primary}, ${template.color_secondary || template.color_primary})`
                              }} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 border-t border-gray-100 bg-white">
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
                disabled={isSubmitting || !name || !templateKey || isAuthChecking || error.includes('sign')}
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