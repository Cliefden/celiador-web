export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export type BillingCycle = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billing_cycle?: BillingCycle;
  
  // Stripe integration
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  stripe_price_id?: string;
  
  // Billing dates
  current_period_start?: string;
  current_period_end?: string;
  trial_start?: string;
  trial_end?: string;
  canceled_at?: string;
  
  // Pricing
  amount_cents?: number;
  currency: string;
}

export interface SubscriptionLimits {
  id: string;
  tier: SubscriptionTier;
  
  // Project limits
  max_projects: number; // -1 means unlimited
  max_templates?: number;
  
  // Feature flags
  voice_commands: boolean;
  github_integration: boolean;
  custom_templates: boolean;
  team_collaboration: boolean;
  advanced_ai_models: boolean;
  priority_support: boolean;
  analytics_dashboard: boolean;
  sso_integration: boolean;
  
  // API limits
  api_calls_per_month: number; // -1 means unlimited
  max_deployments_per_month: number; // -1 means unlimited
  
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  month_year: string; // Format: "2025-08"
  
  projects_created: number;
  api_calls_made: number;
  deployments_made: number;
  voice_commands_used: number;
  
  created_at: string;
  updated_at: string;
}

export interface SubscriptionEvent {
  id: string;
  user_id: string;
  subscription_id: string;
  
  event_type: 'created' | 'upgraded' | 'downgraded' | 'canceled' | 'renewed';
  from_tier?: SubscriptionTier;
  to_tier?: SubscriptionTier;
  amount_cents?: number;
  
  // Stripe data
  stripe_event_id?: string;
  stripe_invoice_id?: string;
  
  created_at: string;
}

// Tier pricing configuration
export const TIER_PRICING = {
  free: {
    name: 'Developer',
    price: 0,
    billing: null,
    description: 'Perfect for getting started with AI development',
    features: [
      '2 projects',
      'Basic templates',
      'Text commands only',
      'Community support',
      'Standard AI models'
    ]
  },
  pro: {
    name: 'Team Lead',
    price: 29,
    billing: 'month' as const,
    description: 'For serious developers and small teams',
    features: [
      '25 projects',
      'All templates',
      'Voice commands 🎤',
      'Priority support',
      'Advanced AI models',
      'GitHub integration',
      'Custom templates'
    ]
  },
  enterprise: {
    name: 'Product Manager',
    price: 99,
    billing: 'month' as const,
    description: 'For large teams and organizations',
    features: [
      'Unlimited projects',
      'Team collaboration',
      'Custom AI model training',
      'Analytics dashboard',
      'SSO integration',
      'Dedicated support',
      'White-label options'
    ]
  }
} as const;

// Helper functions
export function getTierLimits(tier: SubscriptionTier): Partial<SubscriptionLimits> {
  const limits = {
    free: {
      max_projects: 2,
      voice_commands: false,
      github_integration: false,
      custom_templates: false,
      team_collaboration: false,
      advanced_ai_models: false,
      priority_support: false,
      analytics_dashboard: false,
      sso_integration: false,
      api_calls_per_month: 100,
      max_deployments_per_month: 5
    },
    pro: {
      max_projects: 25,
      voice_commands: true,
      github_integration: true,
      custom_templates: true,
      team_collaboration: false,
      advanced_ai_models: true,
      priority_support: true,
      analytics_dashboard: false,
      sso_integration: false,
      api_calls_per_month: 1000,
      max_deployments_per_month: 50
    },
    enterprise: {
      max_projects: -1, // unlimited
      voice_commands: true,
      github_integration: true,
      custom_templates: true,
      team_collaboration: true,
      advanced_ai_models: true,
      priority_support: true,
      analytics_dashboard: true,
      sso_integration: true,
      api_calls_per_month: -1, // unlimited
      max_deployments_per_month: -1 // unlimited
    }
  };
  
  return limits[tier];
}

export function canUserPerformAction(
  userTier: SubscriptionTier,
  action: string,
  currentUsage?: Partial<UsageTracking>
): boolean {
  const limits = getTierLimits(userTier);
  
  switch (action) {
    case 'create_project':
      if (limits.max_projects === -1) return true;
      return (currentUsage?.projects_created || 0) < limits.max_projects!;
      
    case 'voice_command':
      return limits.voice_commands || false;
      
    case 'github_integration':
      return limits.github_integration || false;
      
    case 'custom_template':
      return limits.custom_templates || false;
      
    case 'team_collaboration':
      return limits.team_collaboration || false;
      
    case 'advanced_ai_models':
      return limits.advanced_ai_models || false;
      
    default:
      return false;
  }
}