import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  full_name?: string;
  username?: string;
  email?: string;
}

// Cache for user profiles to avoid repeated API calls
const userProfileCache = new Map<string, UserProfile>();

export async function resolveUserName(userId: string): Promise<string> {
  if (!userId) return 'Unknown User';
  
  console.log('Resolving user name for ID:', userId);
  
  // Check cache first
  if (userProfileCache.has(userId)) {
    const cached = userProfileCache.get(userId)!;
    const name = cached.full_name || cached.username || cached.email || 'Unknown User';
    console.log('Found cached name:', name);
    return name;
  }

  try {
    // Fetch profile from Supabase
    console.log('Fetching profile from Supabase for ID:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn(`Could not resolve user ${userId}:`, error);
      return 'Unknown User';
    }

    if (!data) {
      console.warn(`No profile found for user ${userId}`);
      return 'Unknown User';
    }

    console.log('Found profile data:', data);

    // Cache the result
    userProfileCache.set(userId, data);
    
    // Return the best available name
    const name = data.full_name || data.username || data.email || 'Unknown User';
    console.log('Resolved name:', name);
    return name;
  } catch (error) {
    console.error('Error resolving user name:', error);
    return 'Unknown User';
  }
}

export async function resolveMultipleUserNames(userIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds)].filter(id => id);
  const result = new Map<string, string>();
  
  // Check cache first
  const uncachedIds = uniqueIds.filter(id => !userProfileCache.has(id));
  
  if (uncachedIds.length > 0) {
    try {
      // Fetch all uncached profiles in one query
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, email')
        .in('id', uncachedIds);

      if (error) {
        console.error('Error fetching multiple user profiles:', error);
      } else if (data) {
        // Cache the results
        data.forEach(profile => {
          userProfileCache.set(profile.id, profile);
        });
      }
    } catch (error) {
      console.error('Error resolving multiple user names:', error);
    }
  }

  // Build result map
  uniqueIds.forEach(id => {
    const cached = userProfileCache.get(id);
    if (cached) {
      result.set(id, cached.full_name || cached.username || cached.email || 'Unknown User');
    } else {
      result.set(id, 'Unknown User');
    }
  });

  return result;
}

// Clear cache (useful for testing or when data might be stale)
export function clearUserCache(): void {
  userProfileCache.clear();
}
