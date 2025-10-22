'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Triangle, // Vercel logo shape
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Settings,
  Unlink,
  User,
  Building,
  Rocket,
  AlertCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Timer,
  BarChart3,
  Globe,
  History
} from 'lucide-react';

interface VercelConnection {
  type: 'customer' | 'platform';
  connected: boolean;
  username?: string;
  teamId?: string;
  teamSlug?: string;
  projectId?: string;
  projectName?: string;
  deploymentUrl?: string;
  permissions?: string[];
  lastDeploy?: string;
  tokenStatus?: 'valid' | 'expired' | 'revoked';
  trial?: {
    started: string;
    expires: string;
    isActive: boolean;
    daysRemaining: number;
    isExpired: boolean;
    deploymentsUsed: number;
    maxDeployments: number;
  };
}

interface VercelDeployment {
  id: string;
  url: string;
  status: 'PENDING' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED' | 'QUEUED';
  createdAt: string;
  gitCommitSha?: string;
  gitCommitMessage?: string;
  phase?: string;
  progress?: number;
  progressMessage?: string;
  buildLogs?: Array<{
    timestamp: string;
    message: string;
    type: string;
  }>;
  timing?: {
    created: number;
    building?: number;
    ready?: number;
    totalDuration: number;
  };
}

interface VercelIntegrationStatus {
  customerConnection: VercelConnection;
  platformConnection: VercelConnection;
  activeConnection: 'customer' | 'platform' | null;
  projectLinked: boolean;
  currentDeployment?: VercelDeployment;
  recentDeployments?: VercelDeployment[];
}

interface VercelIntegrationPanelProps {
  projectId: string;
  className?: string;
}

export function VercelIntegrationPanel({ projectId, className = '' }: VercelIntegrationPanelProps) {
  const { session } = useAuth();
  const [status, setStatus] = useState<VercelIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<'customer' | 'platform' | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (session && projectId) {
      loadVercelStatus();
    }
  }, [projectId, session]);

  const loadVercelStatus = async () => {
    if (!session) {
      setLoading(false);
      setApiError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setApiError(null); // Clear previous errors

      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/projects/${projectId}/vercel-status`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setApiError(null); // Clear any previous errors on success
      } else {
        console.error('Failed to load Vercel integration status:', response.status);
        
        // Set specific error messages based on response status
        if (response.status === 401) {
          setApiError('Authentication failed - please refresh the page');
        } else if (response.status === 404) {
          setApiError('Vercel integration not found for this project');
        } else if (response.status >= 500) {
          setApiError('Backend service unavailable');
        } else {
          setApiError(`Failed to load status (${response.status})`);
        }
        
        // Clear status when API fails to avoid showing stale data
        setStatus(null);
      }
    } catch (error) {
      console.error('Failed to load Vercel status:', error);
      setApiError('Unable to connect to backend service');
      setStatus(null); // Clear status when network/connection fails
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (type: 'customer' | 'platform') => {
    setConnecting(type);
    
    if (type === 'platform') {
      // Platform connection - auto-setup with Celiador's Vercel account
      connectPlatformVercel();
    } else {
      // Customer connection - OAuth flow to user's Vercel account
      const redirectUri = `${window.location.origin}/auth/vercel/callback`;
      const state = `${type}-${projectId}`;
      
      const vercelUrl = `https://vercel.com/oauth/authorize?` +
        `client_id=${process.env.NEXT_PUBLIC_VERCEL_CLIENT_ID}&` +
        `scope=read_user,read_team,read_project,write_project&` +
        `state=${state}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      window.location.href = vercelUrl;
    }
  };

  const connectPlatformVercel = async () => {
    if (!session) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/projects/${projectId}/vercel-platform-connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await loadVercelStatus();
      }
    } catch (error) {
      console.error('Failed to connect platform Vercel:', error);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (type: 'customer' | 'platform') => {
    if (!session) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/projects/${projectId}/vercel-disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        await loadVercelStatus();
      }
    } catch (error) {
      console.error('Failed to disconnect Vercel:', error);
    }
  };

  const handleDeploy = async (type: 'customer' | 'platform') => {
    if (!session) return;
    
    try {
      setDeploying(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/projects/${projectId}/vercel-deploy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🚀 Deployment successful:', result);
        
        // Handle mock deployments that are immediately ready
        if (result.status === 'READY') {
          console.log('[VERCEL] Mock deployment ready, stopping deploy state');
          console.log('[VERCEL] Deployment URL:', result.url);
          setDeploying(false);
          
          // Update the status directly without panel redraw
          if (status) {
            const updatedStatus = { ...status };
            if (type === 'platform') {
              updatedStatus.platformConnection = {
                ...updatedStatus.platformConnection,
                deploymentUrl: result.url,
                projectName: updatedStatus.platformConnection.projectName || `${result.deploymentId.split('_')[1]}`
              };
            } else {
              updatedStatus.customerConnection = {
                ...updatedStatus.customerConnection,
                deploymentUrl: result.url
              };
            }
            updatedStatus.activeConnection = type;
            updatedStatus.projectLinked = true;
            setStatus(updatedStatus);
            console.log('[VERCEL] Updated UI state with deployment URL - no panel redraw needed');
          }
        } else {
          // For any non-READY status (BUILDING, PENDING, etc.), continue polling
          console.log('[VERCEL] Deployment status:', result.status, '- starting polling...');
          if (status) {
            const updatedStatus = { ...status };
            if (type === 'platform') {
              updatedStatus.platformConnection = {
                ...updatedStatus.platformConnection,
                deploymentUrl: result.url,
                projectName: updatedStatus.platformConnection.projectName || result.deploymentId
              };
            } else {
              updatedStatus.customerConnection = {
                ...updatedStatus.customerConnection,
                deploymentUrl: result.url
              };
            }
            updatedStatus.activeConnection = type;
            updatedStatus.projectLinked = true;
            updatedStatus.currentDeployment = {
              id: result.deploymentId,
              url: result.url,
              status: result.status,
              createdAt: new Date().toISOString()
            };
            setStatus(updatedStatus);
          }
          // Always start polling for non-READY deployments
          pollDeploymentStatus(result.deploymentId);
        }
      }
    } catch (error) {
      console.error('Failed to deploy to Vercel:', error);
      setDeploying(false);
    }
  };

  const pollDeploymentStatus = async (deploymentId: string) => {
    let pollAttempts = 0;
    const maxAttempts = 120; // 10 minutes at 5-second intervals
    
    console.log(`[VERCEL] Starting deployment polling for: ${deploymentId}`);
    
    const interval = setInterval(async () => {
      pollAttempts++;
      
      try {
        console.log(`[VERCEL] Polling attempt ${pollAttempts} for deployment: ${deploymentId}`);
        
        // Use the specific deployment status endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/projects/${projectId}/vercel-deployment/${deploymentId}`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        });
        
        if (response.ok) {
          const deploymentStatus = await response.json();
          console.log(`[VERCEL] Deployment status update:`, deploymentStatus);
          
          // Update the current deployment status in real-time
          if (status) {
            const updatedStatus = { ...status };
            updatedStatus.currentDeployment = {
              id: deploymentStatus.deploymentId,
              url: deploymentStatus.url,
              status: deploymentStatus.status,
              createdAt: deploymentStatus.createdAt || new Date().toISOString(),
              phase: deploymentStatus.phase,
              progress: deploymentStatus.progress,
              progressMessage: deploymentStatus.progressMessage,
              buildLogs: deploymentStatus.buildLogs,
              timing: deploymentStatus.timing
            };
            setStatus(updatedStatus);
          }
          
          // Check if deployment is complete
          if (deploymentStatus.status === 'READY' || deploymentStatus.status === 'ERROR') {
            console.log(`[VERCEL] Deployment completed with status: ${deploymentStatus.status}`);
            clearInterval(interval);
            setDeploying(false);
            
            // Final status reload to get complete data
            await loadVercelStatus();
            return;
          }
          
          // Continue polling if still building
          if (deploymentStatus.status === 'BUILDING' || deploymentStatus.status === 'PENDING') {
            console.log(`[VERCEL] Deployment still ${deploymentStatus.status.toLowerCase()}, continuing to poll...`);
          }
        } else {
          console.warn(`[VERCEL] Failed to get deployment status: ${response.status}`);
          // Fallback to general status check
          await loadVercelStatus();
        }
        
        // Stop polling after max attempts
        if (pollAttempts >= maxAttempts) {
          console.log('[VERCEL] Polling timeout reached');
          clearInterval(interval);
          setDeploying(false);
          return;
        }
      } catch (error) {
        console.error('[VERCEL] Polling error:', error);
        // Don't stop polling on individual errors, just log them
        if (pollAttempts >= 5) { // Only stop after multiple consecutive errors
          clearInterval(interval);
          setDeploying(false);
        }
      }
    }, 5000);

    // Fallback timeout
    setTimeout(() => {
      console.log('[VERCEL] Max polling time reached (10 minutes)');
      clearInterval(interval);
      setDeploying(false);
    }, 600000);
  };

  const getTrialStatus = (trial?: VercelConnection['trial']) => {
    if (!trial) return null;
    
    const { daysRemaining, isExpired, deploymentsUsed, maxDeployments } = trial;
    const usagePercentage = (deploymentsUsed / maxDeployments) * 100;
    
    if (isExpired || deploymentsUsed >= maxDeployments) {
      return {
        status: 'expired',
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-400',
        icon: AlertTriangle,
        message: isExpired ? 'Trial expired' : 'Deployment limit reached'
      };
    } else if (daysRemaining <= 3 || usagePercentage >= 80) {
      return {
        status: 'expiring',
        color: 'text-orange-400',
        bgColor: 'bg-orange-900/20',
        borderColor: 'border-orange-400',
        icon: AlertTriangle,
        message: `${deploymentsUsed}/${maxDeployments} deployments used`
      };
    } else if (daysRemaining <= 7 || usagePercentage >= 60) {
      return {
        status: 'warning',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        borderColor: 'border-yellow-400',
        icon: Clock,
        message: `${deploymentsUsed}/${maxDeployments} deployments used`
      };
    } else {
      return {
        status: 'active',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-400',
        icon: CheckCircle,
        message: `${deploymentsUsed}/${maxDeployments} deployments used`
      };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDeploymentStatusIcon = (status: string) => {
    switch (status) {
      case 'READY':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'BUILDING':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'PENDING':
      case 'QUEUED':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'CANCELED':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const renderTrialInfo = (connection: VercelConnection) => {
    if (!connection.trial || connection.type !== 'platform') return null;
    
    const trialStatus = getTrialStatus(connection.trial);
    if (!trialStatus) return null;
    
    const { trial } = connection;
    const StatusIcon = trialStatus.icon;
    const usagePercentage = (trial.deploymentsUsed / trial.maxDeployments) * 100;
    
    return (
      <div className={`mt-3 p-3 rounded-lg border ${trialStatus.bgColor} ${trialStatus.borderColor}`}>
        <div className="flex items-center space-x-2 mb-2">
          <StatusIcon className={`w-4 h-4 ${trialStatus.color}`} />
          <span className={`text-sm font-medium ${trialStatus.color}`}>
            Platform Trial: {trialStatus.message}
          </span>
        </div>
        
        {/* Usage Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-300 mb-1">
            <span>Deployments Used</span>
            <span>{trial.deploymentsUsed}/{trial.maxDeployments}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                usagePercentage >= 100 ? 'bg-red-400' :
                usagePercentage >= 80 ? 'bg-orange-400' :
                usagePercentage >= 60 ? 'bg-yellow-400' : 'bg-green-400'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>
        
        <div className="text-xs text-gray-300 space-y-1">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3" />
            <span>Started: {formatDate(trial.started)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Timer className="w-3 h-3" />
            <span>Expires: {formatDate(trial.expires)}</span>
          </div>
        </div>
        
        {(trialStatus.status === 'expiring' || trialStatus.status === 'expired') && (
          <div className="mt-2 text-xs text-gray-300">
            {trialStatus.status === 'expired' ? (
              <span>Connect your Vercel account to continue deployments.</span>
            ) : (
              <span>Connect your Vercel account before trial expires to avoid deployment interruption.</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMigrationPrompt = () => {
    if (!status) return null;
    
    const { platformConnection, customerConnection } = status;
    const trialStatus = getTrialStatus(platformConnection.trial);
    
    // Show migration prompt if platform trial is expiring/expired and customer isn't connected
    if (trialStatus && (trialStatus.status === 'expiring' || trialStatus.status === 'expired') && !customerConnection.connected) {
      return (
        <Card className="p-4 border border-orange-500 bg-orange-900/10 mb-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-orange-400 mb-1">
                {trialStatus.status === 'expired' ? 'Action Required' : 'Migration Recommended'}
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                {trialStatus.status === 'expired' 
                  ? 'Your platform Vercel trial has expired. Connect your own Vercel account to continue deployments.'
                  : `Your platform Vercel trial is running low. Connect your Vercel account now to ensure uninterrupted deployments.`
                }
              </p>
              <Button 
                onClick={() => handleConnect('customer')}
                disabled={connecting === 'customer'}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                {connecting === 'customer' ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Triangle className="w-3 h-3 mr-1" />
                )}
                Connect Your Vercel Account
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      );
    }
    
    return null;
  };

  const renderConnectionCard = (connection: VercelConnection, type: 'customer' | 'platform') => {
    const isCustomer = type === 'customer';
    const title = isCustomer ? 'Customer Vercel Account' : 'Platform Vercel Account';
    const description = isCustomer 
      ? 'Connect your personal/team Vercel account for unlimited deployments'
      : 'Use Celiador\'s managed Vercel integration for quick deployment setup';

    return (
      <Card className="p-4 border border-gray-700 bg-gray-800/50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {isCustomer ? (
              <User className="w-5 h-5 text-blue-400" />
            ) : (
              <Building className="w-5 h-5 text-purple-400" />
            )}
            <div>
              <h3 className="font-medium text-white">{title}</h3>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </div>
          
          {connection.connected ? (
            <Badge variant="outline" className="text-green-400 border-green-400">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-400 border-gray-500">
              <XCircle className="w-3 h-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>

        {connection.connected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Team:</span>
              <span className="text-white font-mono">{connection.teamSlug || connection.username}</span>
            </div>
            
            {connection.projectName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Project:</span>
                <span className="text-white font-mono">{connection.projectName}</span>
              </div>
            )}
            
            {connection.deploymentUrl && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Live URL:</span>
                <a 
                  href={connection.deploymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline font-mono text-xs"
                >
                  {connection.deploymentUrl.replace('https://', '')}
                </a>
              </div>
            )}
            
            {connection.tokenStatus && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Token Status:</span>
                <Badge 
                  variant="outline" 
                  className={`
                    ${connection.tokenStatus === 'valid' ? 'text-green-400 border-green-400' : ''}
                    ${connection.tokenStatus === 'expired' ? 'text-yellow-400 border-yellow-400' : ''}
                    ${connection.tokenStatus === 'revoked' ? 'text-red-400 border-red-400' : ''}
                  `}
                >
                  {connection.tokenStatus}
                </Badge>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <Button
                onClick={() => handleDeploy(type)}
                disabled={deploying}
                className={`${isCustomer ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                size="sm"
              >
                {deploying ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4 mr-1" />
                )}
                Deploy
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect(type)}
                className="text-red-400 border-red-400 hover:bg-red-400/10"
              >
                <Unlink className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
              
              {connection.deploymentUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(connection.deploymentUrl, '_blank')}
                  className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Visit
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <Button
              onClick={() => handleConnect(type)}
              disabled={connecting === type}
              className={`w-full ${isCustomer ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {connecting === type ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Triangle className="w-4 h-4 mr-2" />
              )}
              Connect {isCustomer ? 'Your' : 'Platform'} Account
            </Button>
          </div>
        )}
        
        {/* Trial information for platform connection */}
        {renderTrialInfo(connection)}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!status && apiError) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-400 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-400" />
          <h3 className="text-lg font-medium text-red-400 mb-2">Connection Failed</h3>
          <p className="text-sm text-gray-300 mb-4 max-w-md">{apiError}</p>
          <Button variant="outline" size="sm" onClick={loadVercelStatus} className="mt-2">
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  if (!status && !apiError) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-400 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>No Vercel integration data available</p>
          <Button variant="outline" size="sm" onClick={loadVercelStatus} className="mt-2">
            <RefreshCw className="w-4 h-4 mr-1" />
            Load Integration
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Vercel Integration</h2>
          <p className="text-sm text-gray-400">Manage deployments for this project</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadVercelStatus}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <Card className="p-3 border-red-500 bg-red-900/20">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-300">{apiError}</p>
              <p className="text-xs text-red-400 mt-1">
                Status information below may be outdated. Click refresh to reconnect.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadVercelStatus}
              className="text-red-400 border-red-400 hover:bg-red-400/10"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </Card>
      )}

      {/* Migration Prompt */}
      {renderMigrationPrompt()}

      {/* Active Deployment Status */}
      {(status.currentDeployment || deploying) && (
        <Card className="p-4 border-blue-600 bg-blue-600/10">
          <div className="flex items-center space-x-3 mb-3">
            {status.currentDeployment ? 
              getDeploymentStatusIcon(status.currentDeployment.status) : 
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            }
            <div className="flex-1">
              <h3 className="font-medium text-blue-400">
                {deploying && !status.currentDeployment ? 'Starting Deployment...' : 
                 status.currentDeployment?.phase === 'ready' ? 'Deployment Complete' :
                 status.currentDeployment?.phase === 'building' ? 'Building Application' :
                 status.currentDeployment?.phase === 'queued' ? 'Deployment Queued' :
                 status.currentDeployment?.phase === 'error' ? 'Build Failed' :
                 'Deploying...'}
              </h3>
              <p className="text-sm text-gray-300">
                {status.currentDeployment?.progressMessage || 
                 (deploying ? 'Preparing deployment...' : 'Processing...')}
              </p>
              
              {/* Show elapsed time for active deployments */}
              {status.currentDeployment?.timing && status.currentDeployment.phase !== 'ready' && (
                <p className="text-xs text-gray-400 mt-1">
                  Elapsed: {Math.floor((Date.now() - status.currentDeployment.timing.created) / 1000)}s
                </p>
              )}
            </div>
          </div>
          
          {/* Enhanced Progress bar */}
          {(deploying || ['building', 'queued', 'initializing'].includes(status.currentDeployment?.phase || '')) && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>
                  {status.currentDeployment?.phase === 'queued' ? 'Queued' :
                   status.currentDeployment?.phase === 'building' ? 'Building' :
                   'Uploading'}
                </span>
                <span>{status.currentDeployment?.progress || 10}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    status.currentDeployment?.phase === 'building' ? 'bg-blue-500' :
                    status.currentDeployment?.phase === 'queued' ? 'bg-yellow-500' : 
                    'bg-blue-500 animate-pulse'
                  }`} 
                  style={{ width: `${status.currentDeployment?.progress || 10}%` }} 
                />
              </div>
            </div>
          )}
          
          {/* Build Logs (if available) */}
          {status.currentDeployment?.buildLogs && status.currentDeployment.buildLogs.length > 0 && (
            <div className="mb-3 p-2 bg-gray-800/50 rounded text-xs">
              <div className="text-gray-400 mb-1 font-medium">Build Output:</div>
              {status.currentDeployment.buildLogs.slice(-3).map((log, index) => (
                <div key={index} className="text-gray-300 font-mono truncate">
                  {log.message}
                </div>
              ))}
            </div>
          )}
          
          {status.currentDeployment?.url && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Live URL:</span>
              <a 
                href={status.currentDeployment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline font-mono"
              >
                <Globe className="w-4 h-4 inline mr-1" />
                {status.currentDeployment.url.replace('https://', '')}
              </a>
            </div>
          )}
        </Card>
      )}

      {/* Connection Cards */}
      <div className="space-y-4">
        {renderConnectionCard(status.customerConnection, 'customer')}
        {renderConnectionCard(status.platformConnection, 'platform')}
      </div>

      {/* Deployment History */}
      {status.recentDeployments && status.recentDeployments.length > 0 && (
        <Card className="p-4 border-gray-700 bg-gray-800/30">
          <div className="flex items-center space-x-2 mb-3">
            <History className="w-5 h-5 text-gray-400" />
            <h4 className="font-medium text-white">Recent Deployments</h4>
          </div>
          <div className="space-y-2">
            {status.recentDeployments.slice(0, 3).map((deployment) => (
              <div key={deployment.id} className="flex items-center justify-between p-2 rounded bg-gray-700/50">
                <div className="flex items-center space-x-3">
                  {getDeploymentStatusIcon(deployment.status)}
                  <div>
                    <div className="text-sm text-white font-mono">
                      {deployment.gitCommitMessage || deployment.gitCommitSha?.substring(0, 7) || deployment.id.substring(0, 7)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(deployment.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                {deployment.url && deployment.status === 'READY' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(deployment.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Connection Explanation */}
      <Card className="p-4 border-gray-700 bg-gray-800/30">
        <div className="flex items-start space-x-3">
          <Triangle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-300">
            <h4 className="font-medium text-white mb-2">Connection Types</h4>
            <ul className="space-y-1">
              <li><strong>Customer Account:</strong> Unlimited deployments to your own Vercel account</li>
              <li><strong>Platform Account:</strong> Managed by Celiador, limited trial deployments for quick setup</li>
            </ul>
            <p className="mt-2 text-gray-400">
              Use platform account for quick testing, customer account for production deployments.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}