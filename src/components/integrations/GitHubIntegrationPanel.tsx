'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Github, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Settings,
  Unlink,
  User,
  Users,
  Key,
  AlertCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Timer
} from 'lucide-react';

interface GitHubConnection {
  type: 'customer' | 'platform';
  connected: boolean;
  username?: string;
  repoUrl?: string;
  permissions?: string[];
  lastSync?: string;
  tokenStatus?: 'valid' | 'expired' | 'revoked';
  trial?: {
    started: string;
    expires: string;
    isActive: boolean;
    daysRemaining: number;
    isExpired: boolean;
  };
}

interface GitHubIntegrationStatus {
  customerConnection: GitHubConnection;
  platformConnection: GitHubConnection;
  activeConnection: 'customer' | 'platform' | null;
  projectLinked: boolean;
  repoInfo?: {
    owner: string;
    name: string;
    fullName: string;
    private: boolean;
    defaultBranch: string;
  };
}

interface GitHubIntegrationPanelProps {
  projectId: string;
  className?: string;
}

export function GitHubIntegrationPanel({ projectId, className = '' }: GitHubIntegrationPanelProps) {
  const { session } = useAuth();
  const [status, setStatus] = useState<GitHubIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<'customer' | 'platform' | null>(null);

  useEffect(() => {
    if (session && projectId) {
      loadGitHubStatus();
    }
  }, [projectId, session]);


  const loadGitHubStatus = async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/projects/${projectId}/github-status`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        console.error('Failed to load GitHub integration status:', response.status);
      }
    } catch (error) {
      console.error('Failed to load GitHub status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (type: 'customer' | 'platform') => {
    setConnecting(type);
    
    // Generate OAuth URL with specific scope and state
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const state = `${type}-${projectId}`;
    const scope = type === 'customer' ? 'repo user:email' : 'public_repo user:email read:org';
    
    const githubUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    window.location.href = githubUrl;
  };

  const handleDisconnect = async (type: 'customer' | 'platform') => {
    if (!session) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/projects/${projectId}/github-disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        await loadGitHubStatus();
      }
    } catch (error) {
      console.error('Failed to disconnect GitHub:', error);
    }
  };

  const getTrialStatus = (trial?: GitHubConnection['trial']) => {
    if (!trial) return null;
    
    const { daysRemaining, isExpired, isActive } = trial;
    
    if (isExpired) {
      return {
        status: 'expired',
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-400',
        icon: AlertTriangle,
        message: 'Trial expired'
      };
    } else if (daysRemaining <= 3) {
      return {
        status: 'expiring',
        color: 'text-orange-400',
        bgColor: 'bg-orange-900/20',
        borderColor: 'border-orange-400',
        icon: AlertTriangle,
        message: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`
      };
    } else if (daysRemaining <= 7) {
      return {
        status: 'warning',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        borderColor: 'border-yellow-400',
        icon: Clock,
        message: `${daysRemaining} days remaining`
      };
    } else {
      return {
        status: 'active',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-400',
        icon: CheckCircle,
        message: `${daysRemaining} days remaining`
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

  const renderTrialInfo = (connection: GitHubConnection) => {
    if (!connection.trial || connection.type !== 'platform') return null;
    
    const trialStatus = getTrialStatus(connection.trial);
    if (!trialStatus) return null;
    
    const { trial } = connection;
    const StatusIcon = trialStatus.icon;
    
    return (
      <div className={`mt-3 p-3 rounded-lg border ${trialStatus.bgColor} ${trialStatus.borderColor}`}>
        <div className="flex items-center space-x-2 mb-2">
          <StatusIcon className={`w-4 h-4 ${trialStatus.color}`} />
          <span className={`text-sm font-medium ${trialStatus.color}`}>
            Platform Trial: {trialStatus.message}
          </span>
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
              <span>Connect your GitHub account to continue using the service.</span>
            ) : (
              <span>Connect your GitHub account before trial expires to avoid service interruption.</span>
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
                  ? 'Your platform GitHub trial has expired. Connect your own GitHub account to continue using the service.'
                  : `Your platform GitHub trial expires in ${platformConnection.trial?.daysRemaining} day${platformConnection.trial?.daysRemaining === 1 ? '' : 's'}. Connect your GitHub account now to ensure uninterrupted service.`
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
                  <Github className="w-3 h-3 mr-1" />
                )}
                Connect Your GitHub Account
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      );
    }
    
    return null;
  };

  const renderConnectionCard = (connection: GitHubConnection, type: 'customer' | 'platform') => {
    const isCustomer = type === 'customer';
    const title = isCustomer ? 'Customer GitHub Account' : 'Platform GitHub Account';
    const description = isCustomer 
      ? 'Connect your personal/organization GitHub account for full repository access'
      : 'Use Celiador\'s managed GitHub integration for quick project setup';

    return (
      <Card className="p-4 border border-gray-700 bg-gray-800/50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {isCustomer ? (
              <User className="w-5 h-5 text-blue-400" />
            ) : (
              <Users className="w-5 h-5 text-purple-400" />
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
              <span className="text-gray-400">Username:</span>
              <span className="text-white font-mono">{connection.username}</span>
            </div>
            
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

            {connection.permissions && (
              <div className="text-sm">
                <span className="text-gray-400">Permissions:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {connection.permissions.map((perm) => (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {connection.lastSync && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Last Sync:</span>
                <span className="text-gray-300">{new Date(connection.lastSync).toLocaleString()}</span>
              </div>
            )}

            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect(type)}
                className="text-red-400 border-red-400 hover:bg-red-400/10"
              >
                <Unlink className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
              
              {connection.repoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(connection.repoUrl, '_blank')}
                  className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Repo
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
                <Github className="w-4 h-4 mr-2" />
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

  if (!status) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-400 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Failed to load GitHub integration status</p>
          <Button variant="outline" size="sm" onClick={loadGitHubStatus} className="mt-2">
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
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
          <h2 className="text-lg font-semibold text-white">GitHub Integration</h2>
          <p className="text-sm text-gray-400">Manage GitHub connections for this project</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadGitHubStatus}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Migration Prompt */}
      {renderMigrationPrompt()}

      {/* Active Connection Status */}
      {status.activeConnection && status.projectLinked && status.repoInfo && (
        <Card className="p-4 border-green-600 bg-green-600/10">
          <div className="flex items-center space-x-3 mb-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <h3 className="font-medium text-green-400">Project Linked</h3>
              <p className="text-sm text-gray-300">
                Using {status.activeConnection === 'customer' ? 'customer' : 'platform'} connection
              </p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Repository:</span>
              <span className="text-white font-mono">{status.repoInfo.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Branch:</span>
              <span className="text-white font-mono">{status.repoInfo.defaultBranch}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Visibility:</span>
              <Badge variant={status.repoInfo.private ? "secondary" : "outline"}>
                {status.repoInfo.private ? 'Private' : 'Public'}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Connection Cards */}
      <div className="space-y-4">
        {renderConnectionCard(status.customerConnection, 'customer')}
        {renderConnectionCard(status.platformConnection, 'platform')}
      </div>

      {/* Connection Explanation */}
      <Card className="p-4 border-gray-700 bg-gray-800/30">
        <div className="flex items-start space-x-3">
          <Key className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-300">
            <h4 className="font-medium text-white mb-2">Connection Types</h4>
            <ul className="space-y-1">
              <li><strong>Customer Account:</strong> Full access to your private repositories, custom organizations</li>
              <li><strong>Platform Account:</strong> Managed by Celiador, limited to public repos and shared templates</li>
            </ul>
            <p className="mt-2 text-gray-400">
              Choose customer account for private work, platform account for quick public project setup.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}