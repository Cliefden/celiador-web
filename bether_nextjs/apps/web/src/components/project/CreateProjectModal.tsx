'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Plus, Github, Gitlab, Code, Sparkles, Zap, Palette, ShoppingCart, MessageSquare, BarChart3, Globe, Briefcase } from 'lucide-react';
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
  const [templateKey, setTemplateKey] = useState('next-saas-starter');
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

  const templates = [
    {
      key: 'next-saas-starter',
      name: '🚀 SaaS MVP Starter',
      description: 'Complete SaaS boilerplate with auth, payments, and dashboard',
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      color: 'from-purple-500 to-pink-500',
      features: ['Next.js 14', 'Stripe', 'Auth', 'Database']
    },
    {
      key: 'ecommerce-storefront',
      name: '🛍️ E-commerce Storefront',
      description: 'Modern online store with cart, checkout, and admin panel',
      icon: <ShoppingCart className="w-5 h-5 text-green-500" />,
      color: 'from-green-500 to-emerald-500',
      features: ['React', 'Payment', 'Inventory', 'Orders']
    },
    {
      key: 'ai-chat-app',
      name: '🤖 AI Chat Application',
      description: 'ChatGPT-style interface with real-time conversations',
      icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
      color: 'from-blue-500 to-cyan-500',
      features: ['OpenAI', 'Real-time', 'Chat UI', 'History']
    },
    {
      key: 'dashboard-analytics',
      name: '📊 Analytics Dashboard',
      description: 'Beautiful data visualization with charts and metrics',
      icon: <BarChart3 className="w-5 h-5 text-orange-500" />,
      color: 'from-orange-500 to-red-500',
      features: ['Chart.js', 'Real-time', 'KPIs', 'Export']
    },
    {
      key: 'portfolio-website',
      name: '🎨 Portfolio Website',
      description: 'Stunning personal portfolio with animations and CMS',
      icon: <Palette className="w-5 h-5 text-indigo-500" />,
      color: 'from-indigo-500 to-purple-500',
      features: ['Framer Motion', 'CMS', 'SEO', 'Mobile']
    },
    {
      key: 'business-landing',
      name: '💼 Business Landing Page',
      description: 'High-converting landing page with contact forms and analytics',
      icon: <Briefcase className="w-5 h-5 text-slate-600" />,
      color: 'from-slate-600 to-slate-800',
      features: ['Lead Gen', 'Analytics', 'Forms', 'SEO']
    },
    {
      key: 'blog-platform',
      name: '📝 Blog Platform',
      description: 'Full-featured blogging platform with markdown and comments',
      icon: <Globe className="w-5 h-5 text-teal-500" />,
      color: 'from-teal-500 to-green-500',
      features: ['Markdown', 'Comments', 'Tags', 'RSS']
    },
    {
      key: 'api-microservice',
      name: '⚡ API Microservice',
      description: 'Scalable REST API with documentation and testing',
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      color: 'from-yellow-500 to-orange-500',
      features: ['Express', 'Swagger', 'Tests', 'Docker']
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <div>
            <CardTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Start Your Magic Journey
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Create something amazing with AI-powered development</p>
          </div>
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
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Choose Your Template</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Start with a professionally crafted template to accelerate your development
                </p>
              </div>
              <div className="grid gap-3 max-h-64 overflow-y-auto pr-2">
                {templates.map((template) => (
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
                        {template.icon}
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
                className="min-w-[140px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Creating Magic...</span>
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