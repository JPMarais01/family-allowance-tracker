import { Session, User } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { FamilyMember } from '../lib/types';
import { useAuthStore } from '../stores/AuthStore';

export interface AuthHookResult {
  session: Session | null;
  user: User | null;
  familyMember: FamilyMember | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
}

/**
 * Custom hook to use authentication functionality
 * This hook initializes the auth store and provides access to auth state and methods
 */
export function useAuth(): AuthHookResult {
  const authStore = useAuthStore();

  // Initialize the auth store on mount
  useEffect(() => {
    const cleanup = authStore.initialize();
    return cleanup;
  }, [authStore]);

  return {
    session: authStore.session,
    user: authStore.user,
    familyMember: authStore.familyMember,
    loading: authStore.loading,
    signIn: authStore.signIn,
    signUp: authStore.signUp,
    signOut: authStore.signOut,
    resetPassword: authStore.resetPassword,
  };
}
