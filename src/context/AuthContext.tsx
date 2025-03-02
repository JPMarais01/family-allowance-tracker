/* eslint-disable @typescript-eslint/no-explicit-any */
import { Session, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useEffect, useState } from 'react';
import { toaster } from '../components/ui/toast-instance';
import { supabase } from '../lib/supabase';

// Define types for our context
export type AuthContextType = {
  session: Session | null;
  user: User | null;
  familyMember: any | null; // Will be typed properly once we define the FamilyMember type
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
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export the context for use in the hook file
export { AuthContext };

// Provider component
export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [familyMember, setFamilyMember] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // If we have a user, fetch their role and family member data
      if (session?.user) {
        fetchFamilyMember(session.user.id);
      } else {
        setFamilyMember(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch family member data
  async function fetchFamilyMember(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching family member:', error);
        toaster.create({
          title: 'Error',
          description: 'Failed to fetch family member data',
          type: 'error',
        });
        return;
      }

      setFamilyMember(data || null);
    } catch (error) {
      console.error('Error in fetchFamilyMember:', error);
      toaster.create({
        title: 'Error',
        description: 'An unexpected error occurred while fetching family member data',
        type: 'error',
      });
    }
  }

  // Sign in with email and password
  const signIn = async (
    email: string,
    password: string
  ): Promise<{
    error: Error | null;
    data: Session | null;
  }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { data: data.session, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  // Sign up with email and password
  const signUp = async (
    email: string,
    password: string
  ): Promise<{
    error: Error | null;
    data: Session | null;
  }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      return { data: data.session, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  // Reset password
  const resetPassword = async (
    email: string
  ): Promise<{
    error: Error | null;
    data: any;
  }> => {
    try {
      return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const value = {
    session,
    user,
    familyMember,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
