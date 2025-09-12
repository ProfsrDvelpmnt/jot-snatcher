// Supabase Direct Authentication Service for Chrome Extension
// This service now uses the direct Supabase connection approach
import { directSupabaseAuth } from './directSupabaseAuth';

// Re-export the direct Supabase auth service for backward compatibility
export const supabaseAuth = directSupabaseAuth;

// Re-export types for backward compatibility
export type { DirectSupabaseAuthState as SupabaseAuthState } from './directSupabaseAuth';

// Define types for backward compatibility
export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
}

export interface SupabaseSubscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}