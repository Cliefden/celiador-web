import { createClient } from '@supabase/supabase-js';
import type { 
  SubscriptionTier, 
  Subscription, 
  SubscriptionLimits, 
  UsageTracking,
  SubscriptionEvent 
} from '../types/subscription';

export class SubscriptionService {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  // Get user's current subscription
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  }

  // Get user's current tier from profile
  async getUserTier(userId: string): Promise<SubscriptionTier> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('current_tier')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user tier:', error);
      return 'free'; // Default to free on error
    }

    return data?.current_tier || 'free';
  }

  // Get tier limits
  async getTierLimits(tier: SubscriptionTier): Promise<SubscriptionLimits | null> {
    const { data, error } = await this.supabase
      .from('subscription_limits')
      .select('*')
      .eq('tier', tier)
      .single();

    if (error) {
      console.error('Error fetching tier limits:', error);
      return null;
    }

    return data;
  }

  // Get current month usage for user
  async getCurrentUsage(userId: string): Promise<UsageTracking | null> {
    const currentMonth = new Date().toISOString().slice(0, 7); // "2025-08"
    
    const { data, error } = await this.supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonth)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching usage:', error);
      return null;
    }

    return data;
  }

  // Check if user can perform a specific action
  async canUserPerformAction(userId: string, action: string): Promise<boolean> {
    const tier = await this.getUserTier(userId);
    const limits = await this.getTierLimits(tier);
    const usage = await this.getCurrentUsage(userId);

    if (!limits) return false;

    switch (action) {
      case 'create_project':
        if (limits.max_projects === -1) return true; // unlimited
        
        const { count } = await this.supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .is('deleter', null);
        
        return (count || 0) < limits.max_projects;

      case 'voice_command':
        return limits.voice_commands;

      case 'github_integration':
        return limits.github_integration;

      case 'custom_template':
        return limits.custom_templates;

      case 'team_collaboration':
        return limits.team_collaboration;

      case 'advanced_ai_models':
        return limits.advanced_ai_models;

      default:
        return false;
    }
  }

  // Track usage for billing/analytics
  async trackUsage(userId: string, usageType: string, amount: number = 1): Promise<void> {
    const { error } = await this.supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_usage_type: usageType,
      p_amount: amount
    });

    if (error) {
      console.error('Error tracking usage:', error);
    }
  }

  // Create or update subscription
  async createSubscription(
    userId: string, 
    tier: SubscriptionTier,
    stripeData?: {
      subscription_id: string;
      customer_id: string;
      price_id: string;
    }
  ): Promise<Subscription | null> {
    const subscriptionData = {
      user_id: userId,
      tier,
      status: 'active' as const,
      billing_cycle: tier === 'free' ? undefined : 'monthly' as const,
      ...stripeData && {
        stripe_subscription_id: stripeData.subscription_id,
        stripe_customer_id: stripeData.customer_id,
        stripe_price_id: stripeData.price_id
      }
    };

    const { data, error } = await this.supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return null;
    }

    // Update user's tier in profile
    await this.supabase
      .from('profiles')
      .update({ current_tier: tier })
      .eq('id', userId);

    return data;
  }

  // Log subscription events
  async logSubscriptionEvent(
    userId: string,
    subscriptionId: string,
    eventType: SubscriptionEvent['event_type'],
    fromTier?: SubscriptionTier,
    toTier?: SubscriptionTier,
    amountCents?: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from('subscription_events')
      .insert({
        user_id: userId,
        subscription_id: subscriptionId,
        event_type: eventType,
        from_tier: fromTier,
        to_tier: toTier,
        amount_cents: amountCents
      });

    if (error) {
      console.error('Error logging subscription event:', error);
    }
  }

  // Get subscription analytics (for admin)
  async getSubscriptionAnalytics() {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select(`
        tier,
        status,
        created_at,
        amount_cents,
        billing_cycle
      `);

    if (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }

    // Aggregate data
    const analytics = {
      total_subscribers: data.length,
      by_tier: data.reduce((acc, sub) => {
        acc[sub.tier] = (acc[sub.tier] || 0) + 1;
        return acc;
      }, {} as Record<SubscriptionTier, number>),
      monthly_revenue: data
        .filter(sub => sub.billing_cycle === 'monthly' && sub.status === 'active')
        .reduce((sum, sub) => sum + (sub.amount_cents || 0), 0) / 100,
      annual_revenue: data
        .filter(sub => sub.billing_cycle === 'yearly' && sub.status === 'active')
        .reduce((sum, sub) => sum + (sub.amount_cents || 0), 0) / 100
    };

    return analytics;
  }
}