import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Provider {
  id: string;
  provider_key: string;
  display_name: string;
  auth_header_format: string;
  api_base_url: string;
  default_model: string;
  is_active: boolean;
}

interface UserApiKey {
  id: string;
  user_id: string;
  provider_id: string;
  key_name: string;
  encrypted_key: string;
  key_hash: string;
  key_prefix: string;
  is_active: boolean;
  is_valid: boolean;
}

export class ApiKeyService {
  private static readonly ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY || 'your-32-char-secret-key-here!!';
  private static readonly ALGORITHM = 'aes-256-gcm';

  // Encrypt API key for storage
  static encryptApiKey(plainKey: string): { encrypted: string; hash: string; prefix: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ALGORITHM, this.ENCRYPTION_KEY);
    
    let encrypted = cipher.update(plainKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const hash = crypto.createHash('sha256').update(plainKey).digest('hex');
    const prefix = plainKey.substring(0, 8) + '...';
    
    return {
      encrypted: iv.toString('hex') + ':' + encrypted,
      hash,
      prefix
    };
  }

  // Decrypt API key for use
  static decryptApiKey(encryptedKey: string): string {
    const [ivHex, encrypted] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(this.ALGORITHM, this.ENCRYPTION_KEY);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Get active providers
  static async getActiveProviders(): Promise<Provider[]> {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('is_active', true)
      .eq('maintenance_mode', false)
      .is('deleted_at', null);

    if (error) throw error;
    return data || [];
  }

  // Get user's API keys for a provider
  static async getUserApiKeys(userId: string, providerId: string): Promise<UserApiKey[]> {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (error) throw error;
    return data || [];
  }

  // Get best API key for a user/provider (user key > platform key > null)
  static async getBestApiKey(userId: string, providerId: string): Promise<{
    key: string;
    source: 'user' | 'platform' | 'free_tier';
    keyId?: string;
  } | null> {
    // 1. Try user's own API key first
    const userKeys = await this.getUserApiKeys(userId, providerId);
    if (userKeys.length > 0) {
      const activeKey = userKeys.find(k => k.is_valid) || userKeys[0];
      return {
        key: this.decryptApiKey(activeKey.encrypted_key),
        source: 'user',
        keyId: activeKey.id
      };
    }

    // 2. Check if user can use free tier
    const canUseFree = await this.canUseFreeTier(userId, providerId);
    if (canUseFree) {
      const platformKey = await this.getPlatformKey(providerId);
      if (platformKey) {
        return {
          key: platformKey,
          source: 'free_tier'
        };
      }
    }

    // 3. No available keys
    return null;
  }

  // Check if user can use free tier
  static async canUseFreeTier(userId: string, providerId: string): Promise<boolean> {
    const { data } = await supabase.rpc('can_user_make_request', {
      user_uuid: userId,
      provider_uuid: providerId,
      estimated_tokens: 1000
    });

    return data === true;
  }

  // Get platform API key for provider
  static async getPlatformKey(providerId: string): Promise<string | null> {
    // Get provider info to determine which env var to use
    const { data: provider } = await supabase
      .from('providers')
      .select('provider_key')
      .eq('id', providerId)
      .single();

    if (!provider) return null;

    // Map provider to environment variable
    const envKeyMap: Record<string, string> = {
      'anthropic': 'ANTHROPIC_API_KEY',
      'openai': 'OPENAI_API_KEY',
      'google': 'GOOGLE_API_KEY'
    };

    const envKey = envKeyMap[provider.provider_key];
    return envKey ? process.env[envKey] || null : null;
  }

  // Record API usage
  static async recordUsage({
    providerId,
    projectId,
    operationType,
    modelUsed,
    inputTokens,
    outputTokens,
    keySource,
    responseTimeMs,
    success = true,
    errorMessage
  }: {
    providerId: string;
    projectId: string;
    operationType: string;
    modelUsed: string;
    inputTokens: number;
    outputTokens: number;
    keySource: 'user' | 'platform' | 'free_tier';
    responseTimeMs?: number;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    const { error } = await supabase.rpc('record_api_usage', {
      provider_uuid: providerId,
      project_uuid: projectId,
      operation_type: operationType,
      model_used: modelUsed,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      key_source: keySource,
      response_time_ms: responseTimeMs,
      success,
      error_message: errorMessage
    });

    if (error) {
      console.error('Failed to record API usage:', error);
    }
  }

  // Validate API key with provider
  static async validateApiKey(providerId: string, apiKey: string): Promise<boolean> {
    try {
      const { data: provider } = await supabase
        .from('providers')
        .select('provider_key, api_base_url, auth_header_format')
        .eq('id', providerId)
        .single();

      if (!provider) return false;

      // Make a minimal test request to validate the key
      const testUrl = this.getTestEndpoint(provider.provider_key, provider.api_base_url);
      const authHeader = provider.auth_header_format.replace('{key}', apiKey);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  private static getTestEndpoint(providerKey: string, baseUrl: string): string {
    const testEndpoints: Record<string, string> = {
      'anthropic': `${baseUrl}/v1/messages`,
      'openai': `${baseUrl}/v1/models`,
      'google': `${baseUrl}/v1beta/models`
    };

    return testEndpoints[providerKey] || `${baseUrl}/`;
  }
}