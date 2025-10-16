'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Github, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Settings,
  Unlink
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useAuth } from '../../contexts/AuthContext';

interface IntegrationStatus {
  github: {
    connected: boolean;
    projectLinked: boolean;
    repoUrl?: string;
  };
  vercel: {
    connected: boolean;
    projectId?: string;
    domain?: string;
  };
  deploymentMode: 'GITHUB_ONLY' | 'SMART_BRANCHING';
}

interface VercelProject {
  id: string;
  name: string;
  framework: string;
  targets?: {
    production?: {
      domain: string;
    };
  };
}

interface VercelTeam {
  id: string;
  slug: string;
  name: string;
}

interface IntegrationSetupProps {
  projectId: string;
  onIntegrationChange?: () => void;
}

export function IntegrationSetup({ projectId, onIntegrationChange }: IntegrationSetupProps) {
  const { session } = useAuth();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [vercelSetupOpen, setVercelSetupOpen] = useState(false);
  
  // Vercel setup state
  const [vercelToken, setVercelToken] = useState('');
  const [vercelTeams, setVercelTeams] = useState<VercelTeam[]>([]);
  const [vercelProjects, setVercelProjects] = useState<VercelProject[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [vercelLoading, setVercelLoading] = useState(false);

  useEffect(() => {
    if (session && projectId) {
      loadIntegrationStatus();
    }
  }, [projectId, session]);

  const loadIntegrationStatus = async () => {
    if (!session) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/projects/${projectId}/status`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to load integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubConnect = () => {
    // Redirect to GitHub OAuth
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const state = `project-${projectId}`;
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&scope=repo%20user:email&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    window.location.href = githubUrl;
  };

  const loadVercelTeams = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/vercel/teams`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-vercel-token': token,
        },
      });

      if (response.ok) {
        const teams = await response.json();
        setVercelTeams(teams);
      }
    } catch (error) {
      console.error('Failed to load Vercel teams:', error);
    }
  };

  const loadVercelProjects = async (token: string, teamId?: string) => {
    try {
      const url = teamId 
        ? `${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/vercel/projects?teamId=${teamId}`
        : `${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/vercel/projects`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-vercel-token': token,
        },
      });

      if (response.ok) {
        const projects = await response.json();
        setVercelProjects(projects);
      }
    } catch (error) {
      console.error('Failed to load Vercel projects:', error);
    }
  };

  const handleVercelTokenSubmit = async () => {
    if (!vercelToken.trim()) return;

    setVercelLoading(true);
    
    try {
      await Promise.all([
        loadVercelTeams(vercelToken),
        loadVercelProjects(vercelToken)
      ]);
    } catch (error) {
      console.error('Vercel token validation failed:', error);
    } finally {
      setVercelLoading(false);
    }
  };

  const handleVercelConnect = async () => {
    if (!selectedProject || !vercelToken) return;

    setVercelLoading(true);

    try {
      const project = vercelProjects.find(p => p.id === selectedProject);
      const domain = project?.targets?.production?.domain;

      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/projects/${projectId}/vercel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vercelProjectId: selectedProject,
          vercelTeamId: selectedTeam || undefined,
          accessToken: vercelToken,
          domain,
        }),
      });

      if (response.ok) {
        setVercelSetupOpen(false);
        await loadIntegrationStatus();
        onIntegrationChange?.();
      } else {
        const error = await response.json();
        console.error('Vercel connection failed:', error);
      }
    } catch (error) {
      console.error('Vercel connection request failed:', error);
    } finally {
      setVercelLoading(false);
    }
  };

  const handleVercelDisconnect = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/projects/${projectId}/vercel`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        await loadIntegrationStatus();
        onIntegrationChange?.();
      }
    } catch (error) {
      console.error('Vercel disconnect failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 text-center text-gray-500">
        Failed to load integration status
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Integrations</h3>
        <Badge variant={status.deploymentMode === 'SMART_BRANCHING' ? 'default' : 'secondary'}>
          {status.deploymentMode === 'SMART_BRANCHING' ? 'Smart Branching' : 'GitHub Only'}
        </Badge>
      </div>

      {/* GitHub Integration */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Github className="w-5 h-5" />
            <div>
              <h4 className="font-medium text-gray-900">GitHub</h4>
              <p className="text-sm text-gray-500">
                {status.github.connected 
                  ? (status.github.projectLinked 
                      ? 'Connected and linked to repository' 
                      : 'Connected but no repository linked'
                    )
                  : 'Not connected'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {status.github.connected ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            
            {!status.github.connected && (
              <Button onClick={handleGitHubConnect} size="sm">
                Connect GitHub
              </Button>
            )}
          </div>
        </div>

        {status.github.projectLinked && status.github.repoUrl && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Repository:</span>
              <a
                href={status.github.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {status.github.repoUrl.replace('https://github.com/', '')}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Vercel Integration */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-black text-white flex items-center justify-center text-xs font-bold">
              ▲
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Vercel</h4>
              <p className="text-sm text-gray-500">
                {status.vercel.connected 
                  ? 'Connected and ready for deployment' 
                  : 'Not connected'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {status.vercel.connected ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            
            {status.vercel.connected ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleVercelDisconnect}>
                  <Unlink className="w-3 h-3 mr-1" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Dialog open={vercelSetupOpen} onOpenChange={setVercelSetupOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    Connect Vercel
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Connect to Vercel</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vercel Access Token
                      </label>
                      <input
                        type="password"
                        value={vercelToken}
                        onChange={(e) => setVercelToken(e.target.value)}
                        placeholder="Enter your Vercel access token"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Get your token from{' '}
                        <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          Vercel Settings
                        </a>
                      </p>
                    </div>

                    {!vercelProjects.length && vercelToken && (
                      <Button 
                        onClick={handleVercelTokenSubmit} 
                        disabled={vercelLoading}
                        className="w-full"
                      >
                        {vercelLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Load Projects
                      </Button>
                    )}

                    {vercelTeams.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Team (Optional)
                        </label>
                        <select
                          value={selectedTeam}
                          onChange={(e) => {
                            setSelectedTeam(e.target.value);
                            loadVercelProjects(vercelToken, e.target.value || undefined);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Personal Account</option>
                          {vercelTeams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {vercelProjects.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Project
                        </label>
                        <select
                          value={selectedProject}
                          onChange={(e) => setSelectedProject(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select a project...</option>
                          {vercelProjects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name} ({project.framework})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedProject && (
                      <Button 
                        onClick={handleVercelConnect} 
                        disabled={vercelLoading}
                        className="w-full"
                      >
                        {vercelLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Connect Project
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {status.vercel.connected && status.vercel.domain && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Domain:</span>
              <a
                href={`https://${status.vercel.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {status.vercel.domain}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Integration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
        <div className="text-sm text-blue-800 space-y-1">
          {status.deploymentMode === 'GITHUB_ONLY' ? (
            <p>With GitHub only, all changes are pushed directly to the main branch.</p>
          ) : (
            <>
              <p>• <strong>Push to GitHub:</strong> Creates a feature branch for review</p>
              <p>• <strong>Deploy to Vercel:</strong> Pushes to main branch and triggers production deployment</p>
              <p>• <strong>Preview Deploy:</strong> Creates feature branch with temporary preview URL</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}