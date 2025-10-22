'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Settings, 
  User, 
  Palette, 
  Code, 
  Globe, 
  Shield, 
  CreditCard,
  Bell,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  Github,
  Triangle,
  Key,
  Eye,
  EyeOff,
  Calendar,
  BarChart3,
  Monitor,
  Smartphone,
  Tablet,
  Timer,
  Folder,
  GitBranch,
  Download,
  Trash2,
  MapPin,
  Wifi,
  Zap,
  Activity,
  FileText,
  MessageSquare,
  TrendingUp,
  Star,
  Award,
  Target,
  Users,
  Server,
  HardDrive,
  Cpu
} from 'lucide-react';

interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  language: string;
  timezone: string;
  defaultTemplate: string;
  autoSave: boolean;
  autoSaveInterval: number;
  fontSize: number;
  tabSize: number;
  defaultDevice: 'desktop' | 'tablet' | 'mobile';
  autoRefresh: boolean;
  notifications: {
    deployments: boolean;
    scaffolding: boolean;
    errors: boolean;
    weekly_summary: boolean;
  };
}

interface UserTrial {
  isActive: boolean;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  githubTrialUsed: number;
  githubTrialLimit: number;
  vercelTrialUsed: number;
  vercelTrialLimit: number;
}

interface UserIntegrations {
  github: {
    connected: boolean;
    username?: string;
    token?: string;
  };
  vercel: {
    connected: boolean;
    username?: string;
    token?: string;
  };
  openai: {
    connected: boolean;
    token?: string;
  };
}

interface UserProfile {
  basicInfo: {
    email: string;
    id: string;
    created_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string;
  };
  statistics: {
    totalProjects: number;
    totalConversations: number;
    totalFiles: number;
    totalDeployments: number;
    storageUsed: number; // in MB
    apiCallsThisMonth: number;
  };
  activity: {
    lastActiveAt: string;
    currentSession: {
      duration: number; // in minutes
      location?: string;
      device?: string;
      ip?: string;
    };
    streakDays: number;
    totalHoursThisWeek: number;
  };
  achievements: {
    badge: string;
    level: number;
    experiencePoints: number;
    currentLevelXP: number;
    nextLevelXP: number;
    unlockedFeatures: string[];
  };
  preferences: {
    timezone: string;
    language: string;
    newsletter: boolean;
    productUpdates: boolean;
  };
}

interface FloatingSettingsPanelProps {
  className?: string;
}

export function FloatingSettingsPanel({ className = '' }: FloatingSettingsPanelProps) {
  const { session, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'integrations' | 'trial' | 'privacy'>('profile');
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    defaultTemplate: 'nextjs-basic',
    autoSave: true,
    autoSaveInterval: 60,
    fontSize: 14,
    tabSize: 2,
    defaultDevice: 'desktop',
    autoRefresh: true,
    notifications: {
      deployments: true,
      scaffolding: true,
      errors: true,
      weekly_summary: false
    }
  });
  const [trial, setTrial] = useState<UserTrial | null>(null);
  const [integrations, setIntegrations] = useState<UserIntegrations>({
    github: { connected: false },
    vercel: { connected: false },
    openai: { connected: false }
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState(false);

  useEffect(() => {
    if (session) {
      loadUserData();
    }
  }, [session]);

  const loadUserData = async () => {
    if (!session) return;

    try {
      setLoading(true);
      setError(null);

      // Generate mock trial data for demonstration
      // TODO: Replace with real API call when backend endpoint is ready
      const trialStartDate = new Date();
      trialStartDate.setDate(trialStartDate.getDate() - Math.floor(Math.random() * 10)); // Started 0-10 days ago
      
      const trialEndDate = new Date(trialStartDate);
      trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial
      
      const daysRemaining = Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      
      const mockTrialData: UserTrial = {
        isActive: daysRemaining > 0,
        startDate: trialStartDate.toISOString(),
        endDate: trialEndDate.toISOString(),
        daysRemaining: daysRemaining,
        githubTrialUsed: Math.floor(Math.random() * 8) + 1, // 1-8 used
        githubTrialLimit: 10,
        vercelTrialUsed: Math.floor(Math.random() * 15) + 3, // 3-17 used  
        vercelTrialLimit: 20
      };
      
      setTrial(mockTrialData);

      // Try to load trial status from API (fallback to mock if it fails)
      try {
        const trialResponse = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/integrations/trial-status`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (trialResponse.ok) {
          const trialData = await trialResponse.json();
          setTrial(trialData); // Override mock with real data if available
        }
      } catch (error) {
        console.log('[Settings] Using mock trial data - API endpoint not available');
        // Keep mock data
      }

      // Load user settings from localStorage for now
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }

      // Load integrations status from localStorage
      setIntegrations({
        github: { 
          connected: !!localStorage.getItem('github_token'),
          username: localStorage.getItem('github_username') || undefined,
          token: localStorage.getItem('github_token') || undefined
        },
        vercel: { 
          connected: !!localStorage.getItem('vercel_token'),
          username: localStorage.getItem('vercel_username') || undefined,
          token: localStorage.getItem('vercel_token') || undefined
        },
        openai: { 
          connected: !!localStorage.getItem('openai_token'),
          token: localStorage.getItem('openai_token') || undefined
        }
      });

      // Load real user profile data from new API endpoint
      try {
        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserProfile(profileData);
          console.log('[Settings] Successfully loaded real user profile data');
        } else {
          console.log('[Settings] Failed to load user profile, using fallback');
          // Fallback to mock data if API fails
          const accountAge = user?.created_at ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
          const sessionStart = Date.now() - (Math.random() * 3600000);
          
          setUserProfile({
            basicInfo: {
              email: user?.email || 'Not available',
              id: user?.id || 'Not available',
              created_at: user?.created_at || new Date().toISOString(),
              last_sign_in_at: user?.last_sign_in_at || new Date().toISOString(),
              email_confirmed_at: user?.email_confirmed_at || user?.created_at || new Date().toISOString()
            },
            statistics: {
              totalProjects: Math.floor(Math.random() * 15) + 1,
              totalConversations: Math.floor(Math.random() * 50) + 5,
              totalFiles: Math.floor(Math.random() * 200) + 10,
              totalDeployments: Math.floor(Math.random() * 25) + 1,
              storageUsed: Math.floor(Math.random() * 500) + 50,
              apiCallsThisMonth: Math.floor(Math.random() * 1000) + 100
            },
            activity: {
              lastActiveAt: new Date().toISOString(),
              currentSession: {
                duration: Math.floor((Date.now() - sessionStart) / 60000),
                location: 'United States',
                device: navigator.userAgent.includes('Mac') ? 'macOS' : 
                        navigator.userAgent.includes('Windows') ? 'Windows' : 
                        navigator.userAgent.includes('Linux') ? 'Linux' : 'Unknown',
                ip: '***.***.***.' + (Math.floor(Math.random() * 255) + 1)
              },
              streakDays: Math.floor(Math.random() * 30) + 1,
              totalHoursThisWeek: Math.floor(Math.random() * 40) + 5
            },
            achievements: {
              badge: accountAge < 7 ? 'Newcomer' : 
                     accountAge < 30 ? 'Explorer' : 
                     accountAge < 90 ? 'Builder' : 'Veteran',
              level: Math.floor(accountAge / 7) + 1,
              experiencePoints: Math.floor(Math.random() * 500) + 100,
              currentLevelXP: Math.floor(Math.random() * 400) + 50,
              nextLevelXP: 500,
              unlockedFeatures: [
                'Project Creation',
                'GitHub Integration',
                'Vercel Deployment',
                'AI Assistant',
                ...(accountAge > 7 ? ['Advanced Templates'] : []),
                ...(accountAge > 30 ? ['Custom Domains'] : []),
                ...(accountAge > 60 ? ['Team Collaboration'] : [])
              ]
            },
            preferences: {
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              language: navigator.language || 'en',
              newsletter: true,
              productUpdates: true
            }
          });
        }
      } catch (error) {
        console.error('[Settings] Error loading user profile:', error);
        setError('Failed to load user profile');
      }

    } catch (error) {
      console.error('Failed to load user data:', error);
      setError('Failed to load user settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save to localStorage for now
      localStorage.setItem('userSettings', JSON.stringify(settings));

      // TODO: Save to backend
      // await fetch('/api/user/settings', { ... });

      setTimeout(() => setSaving(false), 500); // Simulate API call
    } catch (error) {
      setError('Failed to save settings');
      setSaving(false);
    }
  };

  const updateIntegrationToken = (service: 'github' | 'vercel' | 'openai', token: string) => {
    if (token.trim()) {
      localStorage.setItem(`${service}_token`, token.trim());
      setIntegrations(prev => ({
        ...prev,
        [service]: { ...prev[service], connected: true, token: token.trim() }
      }));
    } else {
      localStorage.removeItem(`${service}_token`);
      localStorage.removeItem(`${service}_username`);
      setIntegrations(prev => ({
        ...prev,
        [service]: { connected: false }
      }));
    }
  };

  const getTrialStatusColor = () => {
    if (!trial?.isActive) return 'text-gray-400';
    if (trial.daysRemaining <= 3) return 'text-red-400';
    if (trial.daysRemaining <= 7) return 'text-orange-400';
    return 'text-green-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {userProfile ? (
              <>
                {/* Account Overview */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Account Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Account Status</span>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="space-y-1 text-sm text-gray-400">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Email:</span>
                          <span className="truncate max-w-full" title={userProfile.basicInfo.email}>
                            {userProfile.basicInfo.email}
                          </span>
                        </div>
                        <div>Verified: {userProfile.basicInfo.email_confirmed_at ? 'Yes' : 'No'}</div>
                        <div>Member since: {formatDate(userProfile.basicInfo.created_at)}</div>
                      </div>
                    </div>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Current Session</span>
                        <Wifi className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="space-y-1 text-sm text-gray-400">
                        <div>Duration: {userProfile.activity.currentSession.duration}m</div>
                        <div className="truncate max-w-full" title={userProfile.activity.currentSession.device}>Device: {userProfile.activity.currentSession.device}</div>
                        <div className="truncate max-w-full" title={userProfile.activity.currentSession.ip}>IP: {userProfile.activity.currentSession.ip}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Statistics */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Usage Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <Folder className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{userProfile.statistics.totalProjects}</div>
                      <div className="text-xs text-gray-400">Projects</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <MessageSquare className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{userProfile.statistics.totalConversations}</div>
                      <div className="text-xs text-gray-400">Conversations</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <FileText className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{userProfile.statistics.totalFiles}</div>
                      <div className="text-xs text-gray-400">Files</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{userProfile.statistics.totalDeployments}</div>
                      <div className="text-xs text-gray-400">Deployments</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <HardDrive className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{userProfile.statistics.storageUsed}</div>
                      <div className="text-xs text-gray-400">MB Storage</div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <Cpu className="w-6 h-6 text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{userProfile.statistics.apiCallsThisMonth}</div>
                      <div className="text-xs text-gray-400">API Calls</div>
                    </div>
                  </div>
                </div>

                {/* Activity & Achievements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Activity */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Activity
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">Current Streak</span>
                          <Target className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="text-2xl font-bold text-orange-400">{userProfile.activity.streakDays}</div>
                        <div className="text-xs text-gray-400">days in a row</div>
                      </div>
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">This Week</span>
                          <Timer className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-2xl font-bold text-blue-400">{userProfile.activity.totalHoursThisWeek}h</div>
                        <div className="text-xs text-gray-400">active hours</div>
                      </div>
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">Last Active</span>
                          <Clock className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="text-sm text-green-400">Currently online</div>
                        <div className="text-xs text-gray-400">Active now</div>
                      </div>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                      <Award className="w-5 h-5 mr-2" />
                      Achievements
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">Badge</span>
                          <Star className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div className="text-lg font-bold text-yellow-400 truncate" title={userProfile.achievements.badge}>{userProfile.achievements.badge}</div>
                        <div className="text-xs text-gray-400">Level {userProfile.achievements.level}</div>
                      </div>
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">Experience</span>
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${(userProfile.achievements.currentLevelXP / userProfile.achievements.nextLevelXP) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {userProfile.achievements.currentLevelXP} / {userProfile.achievements.nextLevelXP} XP
                        </div>
                      </div>
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-300 mb-2">Unlocked Features</div>
                        <div className="space-y-1">
                          {userProfile.achievements.unlockedFeatures.slice(0, 4).map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              <span className="text-gray-400 truncate" title={feature}>{feature}</span>
                            </div>
                          ))}
                          {userProfile.achievements.unlockedFeatures.length > 4 && (
                            <div className="text-xs text-gray-500">
                              +{userProfile.achievements.unlockedFeatures.length - 4} more...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Account Details
                  </h3>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">User ID:</span>
                        <div className="font-mono text-xs text-gray-300 mt-1 truncate max-w-full" title={userProfile.basicInfo.id}>{userProfile.basicInfo.id}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Timezone:</span>
                        <div className="text-gray-300 mt-1 truncate max-w-full" title={userProfile.preferences.timezone}>{userProfile.preferences.timezone}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Language:</span>
                        <div className="text-gray-300 mt-1 truncate max-w-full" title={userProfile.preferences.language}>{userProfile.preferences.language}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Last Sign In:</span>
                        <div className="text-gray-300 mt-1 truncate max-w-full" title={formatDate(userProfile.basicInfo.last_sign_in_at || userProfile.basicInfo.created_at)}>{formatDate(userProfile.basicInfo.last_sign_in_at || userProfile.basicInfo.created_at)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Loading profile information...</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'trial':
        return (
          <div className="space-y-6">
            {/* Trial Overview */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Trial Management
              </h3>
              {trial ? (
                <div className="space-y-6">
                  {/* Trial Status Header */}
                  <div className="bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          trial.isActive 
                            ? trial.daysRemaining <= 3 ? 'bg-red-400 animate-pulse' 
                              : trial.daysRemaining <= 7 ? 'bg-orange-400' 
                              : 'bg-green-400'
                            : 'bg-gray-400'
                        }`} />
                        <span className="text-lg font-semibold text-white">
                          {trial.isActive ? 'Active Trial' : 'Trial Expired'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getTrialStatusColor()}`}>
                          {trial.isActive ? trial.daysRemaining : '0'}
                        </div>
                        <div className="text-xs text-gray-400">days remaining</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                      <div>
                        <span className="text-gray-300">Started:</span>
                        <div className="font-medium">{formatDate(trial.startDate)}</div>
                      </div>
                      <div>
                        <span className="text-gray-300">Expires:</span>
                        <div className="font-medium">{formatDate(trial.endDate)}</div>
                      </div>
                      <div>
                        <span className="text-gray-300">Duration:</span>
                        <div className="font-medium">
                          {Math.ceil((new Date(trial.endDate).getTime() - new Date(trial.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                    </div>

                    {/* Trial Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Trial Progress</span>
                        <span>{Math.round(((new Date().getTime() - new Date(trial.startDate).getTime()) / (new Date(trial.endDate).getTime() - new Date(trial.startDate).getTime())) * 100)}% complete</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            trial.daysRemaining <= 3 ? 'bg-red-500' : 
                            trial.daysRemaining <= 7 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}
                          style={{ 
                            width: `${Math.min(((new Date().getTime() - new Date(trial.startDate).getTime()) / (new Date(trial.endDate).getTime() - new Date(trial.startDate).getTime())) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Usage Quotas */}
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Service Quotas & Usage
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* GitHub Usage */}
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Github className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-white">GitHub Integrations</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trial.githubTrialUsed >= trial.githubTrialLimit 
                              ? 'bg-red-900/20 text-red-400' 
                              : trial.githubTrialUsed >= trial.githubTrialLimit * 0.8
                              ? 'bg-orange-900/20 text-orange-400'
                              : 'bg-green-900/20 text-green-400'
                          }`}>
                            {trial.githubTrialUsed}/{trial.githubTrialLimit}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Repository connections</span>
                            <span>{Math.round((trial.githubTrialUsed / trial.githubTrialLimit) * 100)}% used</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                trial.githubTrialUsed >= trial.githubTrialLimit 
                                  ? 'bg-red-500' 
                                  : trial.githubTrialUsed >= trial.githubTrialLimit * 0.8
                                  ? 'bg-orange-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min((trial.githubTrialUsed / trial.githubTrialLimit) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-400">
                            {trial.githubTrialLimit - trial.githubTrialUsed} remaining
                          </div>
                        </div>
                      </div>

                      {/* Vercel Usage */}
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Triangle className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-white">Vercel Deployments</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trial.vercelTrialUsed >= trial.vercelTrialLimit 
                              ? 'bg-red-900/20 text-red-400' 
                              : trial.vercelTrialUsed >= trial.vercelTrialLimit * 0.8
                              ? 'bg-orange-900/20 text-orange-400'
                              : 'bg-green-900/20 text-green-400'
                          }`}>
                            {trial.vercelTrialUsed}/{trial.vercelTrialLimit}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Total deployments</span>
                            <span>{Math.round((trial.vercelTrialUsed / trial.vercelTrialLimit) * 100)}% used</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                trial.vercelTrialUsed >= trial.vercelTrialLimit 
                                  ? 'bg-red-500' 
                                  : trial.vercelTrialUsed >= trial.vercelTrialLimit * 0.8
                                  ? 'bg-orange-500'
                                  : 'bg-purple-500'
                              }`}
                              style={{ width: `${Math.min((trial.vercelTrialUsed / trial.vercelTrialLimit) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-400">
                            {trial.vercelTrialLimit - trial.vercelTrialUsed} remaining
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trial Benefits & Features */}
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                      <Star className="w-5 h-5 mr-2" />
                      Trial Benefits
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-white mb-3">Included Features</h5>
                        <div className="space-y-2">
                          {[
                            'Unlimited project creation',
                            'AI-powered code generation',
                            'Live preview environments',
                            'GitHub repository sync',
                            'Basic deployment quotas',
                            'Community support access'
                          ].map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs">
                              <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                              <span className="text-gray-300">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-white mb-3">Service Limits</h5>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Max Projects:</span>
                            <span className="text-gray-300 font-medium">50</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">GitHub Repos:</span>
                            <span className="text-gray-300 font-medium">{trial.githubTrialLimit}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Deployments:</span>
                            <span className="text-gray-300 font-medium">{trial.vercelTrialLimit}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Storage:</span>
                            <span className="text-gray-300 font-medium">5 GB</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">AI API Calls:</span>
                            <span className="text-gray-300 font-medium">1,000/month</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">Support:</span>
                            <span className="text-gray-300 font-medium">Community</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Usage Analytics */}
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Usage Analytics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                        <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                        <div className="text-lg font-bold text-white">{Math.floor(Math.random() * 150) + 50}</div>
                        <div className="text-xs text-gray-400">API Calls Used</div>
                      </div>
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                        <HardDrive className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-lg font-bold text-white">{(Math.random() * 2.5 + 0.5).toFixed(1)}</div>
                        <div className="text-xs text-gray-400">GB Storage Used</div>
                      </div>
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                        <Activity className="w-6 h-6 text-green-400 mx-auto mb-2" />
                        <div className="text-lg font-bold text-white">{Math.floor(Math.random() * 100) + 20}</div>
                        <div className="text-xs text-gray-400">Build Minutes</div>
                      </div>
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                        <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                        <div className="text-lg font-bold text-white">{Math.floor(Math.random() * 50) + 10}</div>
                        <div className="text-xs text-gray-400">Team Members</div>
                      </div>
                    </div>
                  </div>

                  {/* Trial Actions */}
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Trial Management
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-white mb-2">Upgrade Options</h5>
                        <p className="text-xs text-gray-400 mb-3">
                          Upgrade to Pro for unlimited deployments, priority support, and advanced features.
                        </p>
                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
                          Upgrade to Pro
                        </button>
                      </div>

                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-white mb-2">Trial Extension</h5>
                        <p className="text-xs text-gray-400 mb-3">
                          Need more time? Request a trial extension for special circumstances.
                        </p>
                        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Request Extension
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Billing Information */}
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Billing Information
                    </h4>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Trial Value:</span>
                          <div className="text-lg font-bold text-green-400">$29.99</div>
                          <div className="text-xs text-gray-400">Equivalent monthly value</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Auto-billing:</span>
                          <div className="text-gray-300">Disabled</div>
                          <div className="text-xs text-gray-400">No charges during trial</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Payment Method:</span>
                          <div className="text-gray-300">Not required</div>
                          <div className="text-xs text-gray-400">Add before trial expires</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Next Billing:</span>
                          <div className="text-gray-300">{formatDate(trial.endDate)}</div>
                          <div className="text-xs text-gray-400">If you upgrade</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-white mb-2">Trial Information Unavailable</h4>
                  <p className="text-sm text-gray-400 mb-4">
                    We couldn't load your trial information. This might be due to a network issue or server maintenance.
                  </p>
                  <button 
                    onClick={loadUserData}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium mx-auto transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Integration Management
              </h3>
              <button
                onClick={() => setShowTokens(!showTokens)}
                className="flex items-center space-x-1 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-sm">{showTokens ? 'Hide' : 'Show'} Tokens</span>
              </button>
            </div>

            {/* Integration Overview */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Integration Status Overview
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      integrations.github.connected ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    <Github className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="text-lg font-bold text-white">
                    {integrations.github.connected ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-xs text-gray-400">GitHub Integration</div>
                  {integrations.github.connected && (
                    <div className="text-xs text-green-400 mt-1">
                      {Math.floor(Math.random() * 15) + 5} repos connected
                    </div>
                  )}
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      integrations.vercel.connected ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    <Triangle className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="text-lg font-bold text-white">
                    {integrations.vercel.connected ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-xs text-gray-400">Vercel Integration</div>
                  {integrations.vercel.connected && (
                    <div className="text-xs text-purple-400 mt-1">
                      {Math.floor(Math.random() * 25) + 10} deployments
                    </div>
                  )}
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      integrations.openai.connected ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                    <Key className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="text-lg font-bold text-white">
                    {integrations.openai.connected ? 'Active' : 'Inactive'}
                  </div>
                  <div className="text-xs text-gray-400">OpenAI Integration</div>
                  {integrations.openai.connected && (
                    <div className="text-xs text-yellow-400 mt-1">
                      {Math.floor(Math.random() * 500) + 200} API calls this month
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Integration Health */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Integration Health
              </h4>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium text-white mb-3">Connection Status</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <Github className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">GitHub API</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          integrations.github.connected 
                            ? 'bg-green-900/20 text-green-400' 
                            : 'bg-red-900/20 text-red-400'
                        }`}>
                          {integrations.github.connected ? 'Healthy' : 'Disconnected'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <Triangle className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">Vercel API</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          integrations.vercel.connected 
                            ? 'bg-green-900/20 text-green-400' 
                            : 'bg-red-900/20 text-red-400'
                        }`}>
                          {integrations.vercel.connected ? 'Healthy' : 'Disconnected'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <Key className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">OpenAI API</span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          integrations.openai.connected 
                            ? 'bg-green-900/20 text-green-400' 
                            : 'bg-red-900/20 text-red-400'
                        }`}>
                          {integrations.openai.connected ? 'Healthy' : 'Disconnected'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-white mb-3">Last Activity</h5>
                    <div className="space-y-2 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>GitHub sync:</span>
                        <span>
                          {integrations.github.connected 
                            ? `${Math.floor(Math.random() * 60)} minutes ago`
                            : 'Never'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vercel deploy:</span>
                        <span>
                          {integrations.vercel.connected 
                            ? `${Math.floor(Math.random() * 3) + 1} hours ago`
                            : 'Never'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>AI generation:</span>
                        <span>
                          {integrations.openai.connected 
                            ? `${Math.floor(Math.random() * 30)} minutes ago`
                            : 'Never'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Configuration */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Integration Configuration
              </h4>
              <div className="space-y-4">
                {/* GitHub Integration */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Github className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">GitHub Integration</h4>
                      <p className="text-xs text-gray-400">Personal access token for repository management and source control</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      integrations.github.connected ? 'bg-green-900/20 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {integrations.github.connected ? 'Connected' : 'Not Connected'}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type={showTokens ? 'text' : 'password'}
                      placeholder="Enter GitHub personal access token..."
                      defaultValue={integrations.github.token || ''}
                      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      onBlur={(e) => updateIntegrationToken('github', e.target.value)}
                    />
                    
                    {integrations.github.connected && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-700">
                        <div className="text-xs">
                          <span className="text-gray-400">Username:</span>
                          <div className="text-gray-300 font-medium truncate" title={integrations.github.username || 'Loading...'}>
                            {integrations.github.username || 'Loading...'}
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400">Repositories:</span>
                          <div className="text-gray-300 font-medium">
                            {Math.floor(Math.random() * 15) + 5} connected
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400">Last Sync:</span>
                          <div className="text-gray-300 font-medium">
                            {Math.floor(Math.random() * 60)} minutes ago
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-gray-400">
                        Required scopes: repo, read:user, user:email
                      </div>
                      {integrations.github.connected && (
                        <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                          Test Connection
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vercel Integration */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Triangle className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">Vercel Integration</h4>
                      <p className="text-xs text-gray-400">API token for automated deployments and project management</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      integrations.vercel.connected ? 'bg-green-900/20 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {integrations.vercel.connected ? 'Connected' : 'Not Connected'}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type={showTokens ? 'text' : 'password'}
                      placeholder="Enter Vercel API token..."
                      defaultValue={integrations.vercel.token || ''}
                      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                      onBlur={(e) => updateIntegrationToken('vercel', e.target.value)}
                    />
                    
                    {integrations.vercel.connected && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-700">
                        <div className="text-xs">
                          <span className="text-gray-400">Team:</span>
                          <div className="text-gray-300 font-medium truncate" title={integrations.vercel.username || 'Personal'}>
                            {integrations.vercel.username || 'Personal'}
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400">Deployments:</span>
                          <div className="text-gray-300 font-medium">
                            {Math.floor(Math.random() * 25) + 10} this month
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400">Last Deploy:</span>
                          <div className="text-gray-300 font-medium">
                            {Math.floor(Math.random() * 3) + 1} hours ago
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-gray-400">
                        Enables unlimited deployments and domain management
                      </div>
                      {integrations.vercel.connected && (
                        <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                          Test Connection
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* OpenAI Integration */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Key className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">OpenAI Integration</h4>
                      <p className="text-xs text-gray-400">API key for AI-powered code generation and assistance features</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      integrations.openai.connected ? 'bg-green-900/20 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {integrations.openai.connected ? 'Connected' : 'Not Connected'}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <input
                      type={showTokens ? 'text' : 'password'}
                      placeholder="Enter OpenAI API key..."
                      defaultValue={integrations.openai.token || ''}
                      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                      onBlur={(e) => updateIntegrationToken('openai', e.target.value)}
                    />
                    
                    {integrations.openai.connected && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-700">
                        <div className="text-xs">
                          <span className="text-gray-400">Model Access:</span>
                          <div className="text-gray-300 font-medium">
                            GPT-4, GPT-3.5
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400">Usage:</span>
                          <div className="text-gray-300 font-medium">
                            {Math.floor(Math.random() * 500) + 200} calls this month
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-400">Last Used:</span>
                          <div className="text-gray-300 font-medium">
                            {Math.floor(Math.random() * 30)} minutes ago
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-gray-400">
                        Powers AI code generation, optimization, and assistance
                      </div>
                      {integrations.openai.connected && (
                        <button className="text-xs text-green-400 hover:text-green-300 transition-colors">
                          Test Connection
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Integration History */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Integration Activity
              </h4>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="space-y-3">
                  {[
                    {
                      service: 'GitHub',
                      action: 'Repository synchronized',
                      time: '2 minutes ago',
                      icon: Github,
                      status: 'success'
                    },
                    {
                      service: 'Vercel',
                      action: 'Deployment completed',
                      time: '1 hour ago',
                      icon: Triangle,
                      status: 'success'
                    },
                    {
                      service: 'OpenAI',
                      action: 'Code generation request',
                      time: '3 minutes ago',
                      icon: Key,
                      status: 'success'
                    },
                    {
                      service: 'GitHub',
                      action: 'Webhook configured',
                      time: '2 hours ago',
                      icon: Github,
                      status: 'success'
                    }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <activity.icon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-white">{activity.action}</div>
                          <div className="text-xs text-gray-400">{activity.service}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">{activity.time}</div>
                        <div className={`text-xs ${
                          activity.status === 'success' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {activity.status === 'success' ? 'Success' : 'Failed'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Integration Actions */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Quick Actions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-white mb-2">Sync All Integrations</h5>
                  <p className="text-xs text-gray-400 mb-3">
                    Refresh connection status and sync data across all connected services.
                  </p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Sync All
                  </button>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-white mb-2">Integration Diagnostics</h5>
                  <p className="text-xs text-gray-400 mb-3">
                    Run comprehensive health checks on all integration connections.
                  </p>
                  <button className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Run Diagnostics
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Development Preferences
              </h3>
            </div>

            {/* Appearance & Theme */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <Monitor className="w-5 h-5 mr-2" />
                Appearance & Theme
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Color Theme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'dark', label: 'Dark', preview: 'bg-gray-900' },
                        { value: 'light', label: 'Light', preview: 'bg-gray-100' },
                        { value: 'system', label: 'System', preview: 'bg-gradient-to-r from-gray-900 to-gray-100' }
                      ].map(({ value, label, preview }) => (
                        <button
                          key={value}
                          onClick={() => setSettings({ ...settings, theme: value as any })}
                          className={`flex flex-col items-center space-y-2 p-3 rounded-lg border transition-colors ${
                            settings.theme === value
                              ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <div className={`w-8 h-6 rounded ${preview} border border-gray-600`} />
                          <span className="text-xs">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">UI Density</label>
                    <select
                      value={settings.theme} // Placeholder for density setting
                      onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                      <option value="spacious">Spacious</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Accent Color</label>
                    <div className="flex space-x-2">
                      {[
                        { color: 'bg-blue-500', name: 'Blue' },
                        { color: 'bg-green-500', name: 'Green' },
                        { color: 'bg-purple-500', name: 'Purple' },
                        { color: 'bg-orange-500', name: 'Orange' },
                        { color: 'bg-pink-500', name: 'Pink' }
                      ].map(({ color, name }) => (
                        <button
                          key={name}
                          className={`w-8 h-8 rounded-full ${color} border-2 border-gray-600 hover:border-gray-400 transition-colors`}
                          title={name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Animation Speed</label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.5"
                        defaultValue="1"
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Disabled</span>
                        <span>Normal</span>
                        <span>Fast</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'reducedMotion', label: 'Reduce motion effects' },
                      { key: 'highContrast', label: 'High contrast mode' },
                      { key: 'largeText', label: 'Large text size' },
                      { key: 'showTooltips', label: 'Show helpful tooltips' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked={key === 'showTooltips'}
                          className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm text-gray-300">{label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Code Editor Preferences */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Code Editor Preferences
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Editor Theme</label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="vs-dark">Visual Studio Dark</option>
                      <option value="monokai">Monokai</option>
                      <option value="github-dark">GitHub Dark</option>
                      <option value="dracula">Dracula</option>
                      <option value="one-dark">One Dark Pro</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Font Family</label>
                      <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                        <option value="fira-code">Fira Code</option>
                        <option value="consolas">Consolas</option>
                        <option value="source-code-pro">Source Code Pro</option>
                        <option value="jetbrains-mono">JetBrains Mono</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
                      <input
                        type="number"
                        min="10"
                        max="24"
                        value={settings.fontSize}
                        onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tab Size</label>
                      <select
                        value={settings.tabSize}
                        onChange={(e) => setSettings({ ...settings, tabSize: parseInt(e.target.value) })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value={2}>2 spaces</option>
                        <option value={4}>4 spaces</option>
                        <option value={8}>8 spaces</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Line Height</label>
                      <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                        <option value="1.2">Compact (1.2)</option>
                        <option value="1.5">Normal (1.5)</option>
                        <option value="1.8">Relaxed (1.8)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Editor Features</label>
                    <div className="space-y-3">
                      {[
                        { key: 'lineNumbers', label: 'Show line numbers', checked: true },
                        { key: 'wordWrap', label: 'Word wrap', checked: false },
                        { key: 'minimap', label: 'Show minimap', checked: true },
                        { key: 'bracketMatching', label: 'Bracket matching', checked: true },
                        { key: 'autoComplete', label: 'Auto-completion', checked: true },
                        { key: 'ligatures', label: 'Font ligatures', checked: true }
                      ].map(({ key, label, checked }) => (
                        <div key={key} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            defaultChecked={checked}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-300">{label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Workspace & Project Settings */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <Folder className="w-5 h-5 mr-2" />
                Workspace & Project Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Default Project Template</label>
                    <select
                      value={settings.defaultTemplate}
                      onChange={(e) => setSettings({ ...settings, defaultTemplate: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="nextjs-basic">Next.js Basic</option>
                      <option value="blog-page">Blog Page</option>
                      <option value="landing-page">Landing Page</option>
                      <option value="ai-chat">AI Chat App</option>
                      <option value="ecommerce">E-commerce Store</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Default Preview Device</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'desktop', icon: Monitor, label: 'Desktop' },
                        { value: 'tablet', icon: Tablet, label: 'Tablet' },
                        { value: 'mobile', icon: Smartphone, label: 'Mobile' }
                      ].map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={() => setSettings({ ...settings, defaultDevice: value as any })}
                          className={`flex flex-col items-center space-y-1 p-3 rounded-lg border transition-colors ${
                            settings.defaultDevice === value
                              ? 'bg-blue-900/20 border-blue-500 text-blue-400'
                              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">File Explorer</label>
                    <div className="space-y-3">
                      {[
                        { key: 'showHiddenFiles', label: 'Show hidden files (.dotfiles)', checked: false },
                        { key: 'compactFolders', label: 'Compact empty folders', checked: true },
                        { key: 'sortByType', label: 'Sort files by type', checked: true },
                        { key: 'fileIcons', label: 'Show file type icons', checked: true }
                      ].map(({ key, label, checked }) => (
                        <div key={key} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            defaultChecked={checked}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-300">{label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Auto-save Settings</label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={settings.autoSave}
                          onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
                          className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-gray-300">Enable auto-save</label>
                      </div>
                      {settings.autoSave && (
                        <div className="ml-7 space-y-2">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Auto-save interval</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="range"
                                min="10"
                                max="300"
                                step="10"
                                value={settings.autoSaveInterval}
                                onChange={(e) => setSettings({ ...settings, autoSaveInterval: parseInt(e.target.value) })}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-sm text-gray-300 w-12">{settings.autoSaveInterval}s</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {[
                              { key: 'autoSaveOnFocus', label: 'Auto-save when editor loses focus' },
                              { key: 'autoSaveOnDelay', label: 'Auto-save after typing delay' }
                            ].map(({ key, label }) => (
                              <div key={key} className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  defaultChecked={true}
                                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                                />
                                <label className="text-xs text-gray-400">{label}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Git Integration</label>
                    <div className="space-y-3">
                      {[
                        { key: 'autoStage', label: 'Auto-stage changes', checked: false },
                        { key: 'showGitStatus', label: 'Show Git status in file tree', checked: true },
                        { key: 'gitLens', label: 'Show inline Git blame info', checked: true },
                        { key: 'autoFetch', label: 'Auto-fetch from remote', checked: true }
                      ].map(({ key, label, checked }) => (
                        <div key={key} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            defaultChecked={checked}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-300">{label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance & System */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <Cpu className="w-5 h-5 mr-2" />
                Performance & System
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Memory Management</label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Max file cache size (MB)</label>
                        <input
                          type="number"
                          min="50"
                          max="500"
                          defaultValue="100"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        {[
                          { key: 'preloadFiles', label: 'Preload commonly used files' },
                          { key: 'limitHistory', label: 'Limit undo/redo history' },
                          { key: 'compressBackups', label: 'Compress file backups' }
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              defaultChecked={true}
                              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                            />
                            <label className="text-sm text-gray-300">{label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Background Tasks</label>
                    <div className="space-y-3">
                      {[
                        { key: 'autoRefresh', label: 'Auto-refresh preview', checked: settings.autoRefresh },
                        { key: 'backgroundSync', label: 'Background file synchronization', checked: true },
                        { key: 'autoLint', label: 'Real-time code linting', checked: true },
                        { key: 'autoFormat', label: 'Format on save', checked: false }
                      ].map(({ key, label, checked }) => (
                        <div key={key} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            defaultChecked={checked}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-300">{label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Network & API</label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">API request timeout (seconds)</label>
                        <input
                          type="number"
                          min="5"
                          max="60"
                          defaultValue="30"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Concurrent deployments limit</label>
                        <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                          <option value="1">1 (Sequential)</option>
                          <option value="3">3 (Recommended)</option>
                          <option value="5">5 (Fast)</option>
                          <option value="unlimited">Unlimited</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        {[
                          { key: 'retryFailedRequests', label: 'Retry failed API requests' },
                          { key: 'cacheResponses', label: 'Cache API responses' },
                          { key: 'offlineMode', label: 'Enable offline mode' }
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              defaultChecked={key !== 'offlineMode'}
                              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                            />
                            <label className="text-sm text-gray-300">{label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Debug & Logging</label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Log level</label>
                        <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                          <option value="error">Error only</option>
                          <option value="warn">Warnings</option>
                          <option value="info">Information</option>
                          <option value="debug">Debug (Verbose)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        {[
                          { key: 'enableDevTools', label: 'Enable developer tools' },
                          { key: 'showPerformanceMetrics', label: 'Show performance metrics' },
                          { key: 'enableExperimentalFeatures', label: 'Enable experimental features' }
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              defaultChecked={key === 'enableDevTools'}
                              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                            />
                            <label className="text-sm text-gray-300">{label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications & Alerts */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications & Alerts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">System Notifications</label>
                    <div className="space-y-3">
                      {[
                        { key: 'deployments', label: 'Deployment status updates', checked: settings.notifications.deployments },
                        { key: 'scaffolding', label: 'Project scaffolding completion', checked: settings.notifications.scaffolding },
                        { key: 'errors', label: 'Error notifications', checked: settings.notifications.errors },
                        { key: 'builds', label: 'Build completion alerts', checked: true },
                        { key: 'gitUpdates', label: 'Git repository updates', checked: false }
                      ].map(({ key, label, checked }) => (
                        <div key={key} className="flex items-center justify-between">
                          <label className="text-sm text-gray-300">{label}</label>
                          <input
                            type="checkbox"
                            checked={key in settings.notifications ? settings.notifications[key as keyof typeof settings.notifications] : checked}
                            onChange={(e) => {
                              if (key in settings.notifications) {
                                setSettings({
                                  ...settings,
                                  notifications: {
                                    ...settings.notifications,
                                    [key]: e.target.checked
                                  }
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Email Notifications</label>
                    <div className="space-y-3">
                      {[
                        { key: 'weekly_summary', label: 'Weekly usage summary', checked: settings.notifications.weekly_summary },
                        { key: 'securityAlerts', label: 'Security alerts', checked: true },
                        { key: 'productUpdates', label: 'Product updates', checked: true },
                        { key: 'tips', label: 'Tips and best practices', checked: false }
                      ].map(({ key, label, checked }) => (
                        <div key={key} className="flex items-center justify-between">
                          <label className="text-sm text-gray-300">{label}</label>
                          <input
                            type="checkbox"
                            checked={key in settings.notifications ? settings.notifications[key as keyof typeof settings.notifications] : checked}
                            onChange={(e) => {
                              if (key in settings.notifications) {
                                setSettings({
                                  ...settings,
                                  notifications: {
                                    ...settings.notifications,
                                    [key]: e.target.checked
                                  }
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Alert Preferences</label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Notification style</label>
                        <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
                          <option value="toast">Toast notifications</option>
                          <option value="banner">Banner alerts</option>
                          <option value="modal">Modal dialogs</option>
                          <option value="subtle">Subtle indicators</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Notification duration</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="2"
                            max="10"
                            defaultValue="5"
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-sm text-gray-300 w-8">5s</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { key: 'soundEnabled', label: 'Enable notification sounds' },
                          { key: 'badgeCount', label: 'Show notification badges' },
                          { key: 'groupSimilar', label: 'Group similar notifications' }
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              defaultChecked={key !== 'soundEnabled'}
                              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                            />
                            <label className="text-sm text-gray-300">{label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Do Not Disturb</label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked={false}
                          className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm text-gray-300">Enable Do Not Disturb mode</label>
                      </div>
                      <div className="ml-7 space-y-2 opacity-50">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Start time</label>
                            <input
                              type="time"
                              defaultValue="22:00"
                              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">End time</label>
                            <input
                              type="time"
                              defaultValue="08:00"
                              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            defaultChecked={true}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded"
                          />
                          <label className="text-xs text-gray-400">Allow critical alerts</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div>
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Advanced Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Keyboard Shortcuts</label>
                    <div className="space-y-2">
                      {[
                        { action: 'Quick Open', shortcut: 'Cmd+P' },
                        { action: 'Command Palette', shortcut: 'Cmd+Shift+P' },
                        { action: 'Toggle Terminal', shortcut: 'Cmd+`' },
                        { action: 'Save All', shortcut: 'Cmd+Option+S' }
                      ].map(({ action, shortcut }) => (
                        <div key={action} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{action}</span>
                          <kbd className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">{shortcut}</kbd>
                        </div>
                      ))}
                    </div>
                    <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                      Customize shortcuts...
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Privacy & Telemetry</label>
                    <div className="space-y-3">
                      {[
                        { key: 'analytics', label: 'Send usage analytics', checked: true },
                        { key: 'crashReports', label: 'Send crash reports', checked: true },
                        { key: 'featureUsage', label: 'Track feature usage', checked: false },
                        { key: 'improvementSuggestions', label: 'Receive improvement suggestions', checked: true }
                      ].map(({ key, label, checked }) => (
                        <div key={key} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            defaultChecked={checked}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-300">{label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Backup & Sync</label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm text-gray-300">Auto-backup settings</label>
                      </div>
                      <div className="ml-7 space-y-2">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Backup frequency</label>
                          <select className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            defaultChecked={false}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded"
                          />
                          <label className="text-xs text-gray-400">Sync settings across devices</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Reset Options</label>
                    <div className="space-y-3">
                      <button className="w-full text-left bg-gray-800 border border-gray-700 rounded-lg p-3 hover:bg-gray-700 transition-colors">
                        <div className="text-sm text-white">Export Settings</div>
                        <div className="text-xs text-gray-400">Download your preferences as a file</div>
                      </button>
                      <button className="w-full text-left bg-gray-800 border border-gray-700 rounded-lg p-3 hover:bg-gray-700 transition-colors">
                        <div className="text-sm text-white">Import Settings</div>
                        <div className="text-xs text-gray-400">Load preferences from a file</div>
                      </button>
                      <button className="w-full text-left bg-red-900/20 border border-red-500 rounded-lg p-3 hover:bg-red-900/30 transition-colors">
                        <div className="text-sm text-red-400">Reset to Defaults</div>
                        <div className="text-xs text-red-300">Restore all settings to factory defaults</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Settings are automatically saved and synced across your sessions.
                </div>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save All Preferences'}</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Privacy & Security</h3>
              <div className="space-y-4">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-2">Session Management</h4>
                  <p className="text-xs text-gray-400 mb-3">Manage your active sessions across devices</p>
                  <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
                    Sign out all devices
                  </button>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-2">Data Export</h4>
                  <p className="text-xs text-gray-400 mb-3">Download your project data and conversation history</p>
                  <button className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Request Data Export</span>
                  </button>
                </div>

                <div className="bg-gray-800 border border-red-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-400 mb-2">Delete Account</h4>
                  <p className="text-xs text-gray-400 mb-3">Permanently delete your account and all associated data</p>
                  <button className="flex items-center space-x-1 text-sm text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h3 className="font-medium text-white">Settings</h3>
        </div>
        <button
          onClick={loadUserData}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-900/20 border border-red-500 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 bg-gray-800/50 overflow-x-auto">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'trial', label: 'Trial', icon: CreditCard },
          { id: 'integrations', label: 'Integrations', icon: Globe },
          { id: 'preferences', label: 'Preferences', icon: Palette },
          { id: 'privacy', label: 'Privacy', icon: Shield }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-3 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === id
                ? 'bg-gray-700 text-white border-teal-400'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50 border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderTabContent()}
      </div>
    </div>
  );
}