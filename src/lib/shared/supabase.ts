import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder_key';

// Create client with fallback values for development
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) && 
         (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
};

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  }
};

// Database helpers
export const db = {
  // User operations
  createUser: async (email: string, name?: string) => {
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, name }])
      .select()
      .single();
    return { data, error };
  },

  getUserByEmail: async (email: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    return { data, error };
  },

  // Project operations
  createProject: async (projectData: {
    name: string;
    templateKey: string;
    repoProvider: string;
    repoOwner: string;
    repoName: string;
    env?: Record<string, any>;
    userId: string;
  }) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();
    return { data, error };
  },

  getProjectsByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        jobs (*)
      `)
      .eq('userId', userId)
      .order('updatedAt', { ascending: false });
    return { data, error };
  },

  // Job operations
  createJob: async (jobData: {
    type: string;
    prompt?: string;
    projectId: string;
    userId: string;
  }) => {
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single();
    return { data, error };
  },

  updateJobStatus: async (id: string, status: string, output?: string, error?: string, metadata?: any) => {
    const { data, error: updateError } = await supabase
      .from('jobs')
      .update({ status, output, error, metadata })
      .eq('id', id)
      .select()
      .single();
    return { data, error: updateError };
  }
};
