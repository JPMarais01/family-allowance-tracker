 /**
   * Supabase client configuration
   * This file sets up and exports the Supabase client for database operations
   */
 import { createClient, SupabaseClient } from '@supabase/supabase-js';

 const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
 const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

 // Validate environment variables
 if (!supabaseUrl || !supabaseAnonKey) {
   throw new Error('Missing Supabase environment variables');
 }

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
