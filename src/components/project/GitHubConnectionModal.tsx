'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Github,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  GitBranch,
  Lock,
  Unlock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  github_repo_url?: string;
  github_repo_id?: number;
  github_connected_at?: string;
}

interface GitHubConnectionModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface GitHubStatus {
  connected: boolean;
  username?: string;
}

export function GitHubConnectionModal({ 
  project, 
  open, 
  onOpenChange, 
  onSuccess 
}: GitHubConnectionModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [githubStatus, setGithubStatus] = useState<GitHubStatus>({ connected: false });
  const [repoName, setRepoName] = useState(
    project.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  );
  const [description, setDescription] = useState(`Generated project: ${project.name}`);
  const [isPrivate, setIsPrivate] = useState(false);
  const [step, setStep] = useState<'check' | 'connect' | 'create' | 'success'>('check');
  const [error, setError] = useState<string | null>(null);

  // Check GitHub connection status when modal opens
  useEffect(() => {
    if (open && user) {
      checkGitHubStatus();
    }
  }, [open, user]);

  const checkGitHubStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/auth/github/status`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGithubStatus(data);
        
        // If already connected and project isn't linked to repo, go to create step
        if (data.connected && !project.github_repo_url) {
          setStep('create');
        } else if (project.github_repo_url) {
          setStep('success');
        } else {
          setStep('connect');
        }
      } else {
        setStep('connect');
      }
    } catch (error) {
      console.error('Error checking GitHub status:', error);
      setStep('connect');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/auth/github/connect', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (response.ok) {
        const { authUrl } = await response.json();
        
        // Open GitHub OAuth in new window
        const popup = window.open(authUrl, 'github-oauth', 'width=600,height=700');
        
        // Listen for OAuth completion
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GITHUB_OAUTH_SUCCESS') {
            popup?.close();
            window.removeEventListener('message', messageHandler);
            setGithubStatus({ connected: true, username: event.data.username });
            setStep('create');
          } else if (event.data.type === 'GITHUB_OAUTH_ERROR') {
            popup?.close();
            window.removeEventListener('message', messageHandler);
            setError('GitHub connection failed. Please try again.');
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Check if popup was closed without completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
          }
        }, 1000);
        
      } else {
        setError('Failed to initiate GitHub connection');
      }
    } catch (error) {
      console.error('Error connecting to GitHub:', error);
      setError('Failed to connect to GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepository = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${project.id}/github/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repoName,
          description,
          isPrivate
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStep('success');
        onSuccess?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create repository');
      }
    } catch (error) {
      console.error('Error creating repository:', error);
      setError('Failed to create repository');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'check':
        return (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p>Checking GitHub connection...</p>
          </div>
        );

      case 'connect':
        return (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Github className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Connect your GitHub account to create and sync repositories for your projects.
              </p>
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
            <Button 
              onClick={handleGitHubConnect} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Github className="w-4 h-4 mr-2" />
              )}
              Connect GitHub Account
            </Button>
          </div>
        );

      case 'create':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-800">
                GitHub connected as {githubStatus.username}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="repoName">Repository Name</Label>
                <Input
                  id="repoName"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="my-awesome-project"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Repository names can only contain letters, numbers, and hyphens
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={isPrivate ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className="flex items-center space-x-2"
                >
                  {isPrivate ? (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Private</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>Public</span>
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {isPrivate ? 'Only you can see this repository' : 'Anyone can see this repository'}
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-6 space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <h4 className="text-lg font-semibold text-green-800 mb-2">
                Repository Connected!
              </h4>
              <p className="text-muted-foreground mb-4">
                Your project is now connected to GitHub
              </p>
            </div>
            
            {project.github_repo_url && (
              <Button variant="outline" asChild>
                <a 
                  href={project.github_repo_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2"
                >
                  <Github className="w-4 h-4" />
                  <span>View on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Github className="w-5 h-5" />
            <span>Connect to GitHub</span>
          </DialogTitle>
          <DialogDescription>
            {step === 'connect' && 'Connect your GitHub account to sync your projects'}
            {step === 'create' && 'Create a new repository for this project'}
            {step === 'success' && 'Successfully connected to GitHub'}
          </DialogDescription>
        </DialogHeader>

        {renderStep()}

        <DialogFooter className="flex-col sm:flex-row">
          {step === 'create' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRepository} 
                disabled={loading || !repoName.trim()}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <GitBranch className="w-4 h-4 mr-2" />
                )}
                Create Repository
              </Button>
            </>
          )}
          
          {step === 'success' && (
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}