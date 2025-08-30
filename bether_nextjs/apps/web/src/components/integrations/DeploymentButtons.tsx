'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  GitBranch, 
  Rocket, 
  Eye, 
  Github, 
  Loader2, 
  CheckCircle, 
  XCircle,
  ExternalLink
} from 'lucide-react';

interface DeploymentStrategy {
  type: 'GITHUB_ONLY' | 'SMART_BRANCHING';
  target?: string;
  options?: string[];
}

interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  urls: {
    github?: string;
    vercel?: string;
    preview?: string;
  };
  branch?: string;
  commitSha?: string;
  error?: string;
}

interface DeploymentButtonsProps {
  projectId: string;
  onDeploymentStart?: () => void;
  onDeploymentComplete?: (result: DeploymentResult) => void;
  compact?: boolean;
}

export function DeploymentButtons({ 
  projectId, 
  onDeploymentStart, 
  onDeploymentComplete,
  compact = false 
}: DeploymentButtonsProps) {
  const [strategy, setStrategy] = useState<DeploymentStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<DeploymentResult | null>(null);
  const [commitMessage, setCommitMessage] = useState('Update from Bether Studio');

  useEffect(() => {
    console.log('[DeploymentButtons] useEffect triggered with projectId:', projectId);
    if (projectId) {
      loadDeploymentStrategy();
    } else {
      console.log('[DeploymentButtons] No projectId provided');
    }
  }, [projectId]);

  const loadDeploymentStrategy = async () => {
    try {
      console.log('[DeploymentButtons] Loading deployment strategy for project:', projectId);
      
      // Get token from Supabase session instead of localStorage
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('[DeploymentButtons] No session available for deployment options');
        return;
      }

      console.log('[DeploymentButtons] Making request to:', `http://localhost:4000/api/integrations/projects/${projectId}/deployment-options`);

      const response = await fetch(`http://localhost:4000/api/integrations/projects/${projectId}/deployment-options`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('[DeploymentButtons] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[DeploymentButtons] Deployment strategy:', data);
        setStrategy(data);
      } else {
        const errorText = await response.text();
        console.error('[DeploymentButtons] Failed to load deployment strategy:', response.status, errorText);
        console.error('[DeploymentButtons] Response headers:', Object.fromEntries(response.headers.entries()));
      }
    } catch (error) {
      console.error('[DeploymentButtons] Failed to load deployment strategy - Network error:', error);
      console.error('[DeploymentButtons] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setLoading(false);
    }
  };

  const executeDeployment = async (type: 'GITHUB_PUSH' | 'VERCEL_DEPLOY' | 'PREVIEW_DEPLOY') => {
    setDeploying(type);
    setLastResult(null);
    onDeploymentStart?.();

    try {
      // Get token from Supabase session instead of localStorage
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session available for deployment');
        return;
      }

      const response = await fetch(`http://localhost:4000/api/integrations/projects/${projectId}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type,
          commitMessage,
        }),
      });

      const result = await response.json();
      setLastResult(result);
      onDeploymentComplete?.(result);

      if (result.success) {
        // Show success notification
        console.log('Deployment successful:', result);
      } else {
        console.error('Deployment failed:', result.error);
      }
    } catch (error) {
      console.error('Deployment request failed:', error);
      const errorResult: DeploymentResult = {
        success: false,
        deploymentId: '',
        urls: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setLastResult(errorResult);
      onDeploymentComplete?.(errorResult);
    } finally {
      setDeploying(null);
    }
  };

  if (loading) {
    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs text-gray-600">Loading...</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-600">Loading deployment options...</span>
      </div>
    );
  }

  if (!strategy) {
    if (compact) {
      return (
        <Button variant="outline" size="sm" disabled className="text-xs">
          Connect GitHub
        </Button>
      );
    }
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-sm text-red-600">
          GitHub integration required for deployment. 
          Please connect your project to GitHub first.
        </p>
      </div>
    );
  }

  // Compact mode for ContextBar
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {strategy.type === 'GITHUB_ONLY' ? (
          <Button
            size="sm"
            onClick={() => executeDeployment('GITHUB_PUSH')}
            disabled={deploying !== null}
            className="flex items-center gap-2"
          >
            {deploying === 'GITHUB_PUSH' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Github className="w-3 h-3" />
            )}
            Push
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeDeployment('GITHUB_PUSH')}
              disabled={deploying !== null}
              className="flex items-center gap-1"
            >
              {deploying === 'GITHUB_PUSH' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <GitBranch className="w-3 h-3" />
              )}
              Push
            </Button>
            <Button
              size="sm"
              onClick={() => executeDeployment('VERCEL_DEPLOY')}
              disabled={deploying !== null}
              className="flex items-center gap-1 bg-black hover:bg-gray-800"
            >
              {deploying === 'VERCEL_DEPLOY' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Rocket className="w-3 h-3" />
              )}
              Deploy
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => executeDeployment('PREVIEW_DEPLOY')}
              disabled={deploying !== null}
              className="flex items-center gap-1"
            >
              {deploying === 'PREVIEW_DEPLOY' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              Preview
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Commit Message Input */}
      <div>
        <label htmlFor="commit-message" className="block text-sm font-medium text-gray-700 mb-2">
          Commit Message
        </label>
        <input
          id="commit-message"
          type="text"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Describe your changes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Deployment Buttons */}
      <div className="flex flex-wrap gap-3">
        {strategy.type === 'GITHUB_ONLY' ? (
          <Button
            onClick={() => executeDeployment('GITHUB_PUSH')}
            disabled={deploying !== null || !commitMessage.trim()}
            className="flex items-center gap-2"
          >
            {deploying === 'GITHUB_PUSH' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Github className="w-4 h-4" />
            )}
            Push to GitHub
          </Button>
        ) : (
          <>
            {/* Push to GitHub (Feature Branch) */}
            <Button
              variant="outline"
              onClick={() => executeDeployment('GITHUB_PUSH')}
              disabled={deploying !== null || !commitMessage.trim()}
              className="flex items-center gap-2"
            >
              {deploying === 'GITHUB_PUSH' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GitBranch className="w-4 h-4" />
              )}
              Push to GitHub
            </Button>

            {/* Deploy to Vercel (Main Branch) */}
            <Button
              onClick={() => executeDeployment('VERCEL_DEPLOY')}
              disabled={deploying !== null || !commitMessage.trim()}
              className="flex items-center gap-2 bg-black hover:bg-gray-800"
            >
              {deploying === 'VERCEL_DEPLOY' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              Deploy to Vercel
            </Button>

            {/* Preview Deploy */}
            <Button
              variant="secondary"
              onClick={() => executeDeployment('PREVIEW_DEPLOY')}
              disabled={deploying !== null || !commitMessage.trim()}
              className="flex items-center gap-2"
            >
              {deploying === 'PREVIEW_DEPLOY' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              Preview Deploy
            </Button>
          </>
        )}
      </div>

      {/* Deployment Status */}
      {lastResult && (
        <div className={`p-4 rounded-lg border ${
          lastResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {lastResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-medium ${
                lastResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastResult.success ? 'Deployment Successful' : 'Deployment Failed'}
              </h4>
              
              {lastResult.success && (
                <div className="mt-2 space-y-2">
                  {lastResult.branch && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Branch: {lastResult.branch}
                      </Badge>
                      {lastResult.commitSha && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {lastResult.commitSha.substring(0, 7)}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {lastResult.urls.github && (
                      <a
                        href={lastResult.urls.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Github className="w-3 h-3" />
                        View on GitHub
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    
                    {lastResult.urls.vercel && (
                      <a
                        href={lastResult.urls.vercel}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Rocket className="w-3 h-3" />
                        View Production
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    
                    {lastResult.urls.preview && (
                      <a
                        href={lastResult.urls.preview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-3 h-3" />
                        View Preview
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {!lastResult.success && lastResult.error && (
                <p className="mt-1 text-sm text-red-600">
                  {lastResult.error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deployment Mode Info */}
      <div className="text-xs text-gray-500">
        <strong>Mode:</strong> {strategy.type === 'GITHUB_ONLY' ? 'GitHub Only' : 'Smart Branching'}
        {strategy.type === 'SMART_BRANCHING' && (
          <span className="ml-2">
            • Push creates feature branch • Deploy merges to main • Preview creates temporary deployment
          </span>
        )}
      </div>
    </div>
  );
}