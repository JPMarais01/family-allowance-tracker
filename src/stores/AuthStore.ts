import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from '../hooks/use-toast';
import { supabase } from '../lib/supabase';
import { FamilyMember } from '../lib/types';

interface AuthState {
  // State
  session: Session | null;
  user: User | null;
  familyMember: FamilyMember | null;
  loading: boolean;
  error: string | null;

  // Actions
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setFamilyMember: (familyMember: FamilyMember | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Auth operations
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null; data: Session | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null; data: Session | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null; data: any }>;

  // Data operations
  fetchFamilyMember: (userId: string) => Promise<void>;

  // Initialize
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Helper to fetch family member data
      const fetchFamilyMember = async (userId: string): Promise<void> => {
        // Skip if no userId provided
        if (!userId) {
          set({ familyMember: null });
          return;
        }

        set({ loading: true });

        try {
          const { data, error } = await supabase
            .from('family_members')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) {
            // Check if it's a "not found" error - this is normal for new users
            if (error.code === 'PGRST116') {
              set({ familyMember: null });
              toast({
                title: 'No Family Member Data',
                description: 'Your account is not linked to any family member yet',
                variant: 'warning',
              });
              return;
            }

            toast({
              title: 'Error',
              description: 'Failed to fetch family member data',
              variant: 'destructive',
            });
            // Make sure to set familyMember to null on error
            set({ familyMember: null });
            return;
          }

          // Only update state if the data has actually changed
          if (!data) {
            set({ familyMember: null });
          } else {
            const currentFamilyMember = get().familyMember;
            if (!currentFamilyMember || currentFamilyMember.id !== data.id) {
              set({ familyMember: data });
            }
          }
        } catch {
          toast({
            title: 'Error',
            description: 'An unexpected error occurred while fetching family member data',
            variant: 'destructive',
          });
          // Make sure to set familyMember to null on error
          set({ familyMember: null });
        } finally {
          set({ loading: false });
        }
      };

      return {
        // Initial state
        session: null,
        user: null,
        familyMember: null,
        loading: true,
        error: null,

        // Basic actions
        setSession: (session: Session | null) => set({ session }),
        setUser: (user: User | null) => set({ user }),
        setFamilyMember: (familyMember: FamilyMember | null) => set({ familyMember }),
        setLoading: (loading: boolean) => set({ loading }),
        setError: (error: string | null) => set({ error }),

        // Auth operations
        signIn: async (email: string, password: string) => {
          set({ loading: true, error: null });

          try {
            // Get login attempts from localStorage
            const loginAttemptsStr = localStorage.getItem('loginAttempts');
            const loginAttempts = loginAttemptsStr ? JSON.parse(loginAttemptsStr) : {};

            // Check for too many attempts
            const now = Date.now();
            const attempts = loginAttempts[email] || { count: 0, lastAttempt: 0 };

            // If more than 5 attempts in 15 minutes (900000ms), block the attempt
            if (attempts.count >= 5 && now - attempts.lastAttempt < 900000) {
              set({ loading: false });
              return {
                data: null,
                error: new Error('Too many login attempts. Please try again later.'),
              };
            }

            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            // Update attempts counter on failure
            if (error) {
              loginAttempts[email] = {
                count: (loginAttempts[email]?.count || 0) + 1,
                lastAttempt: now,
              };
              localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));

              set({ error: error.message });
              return { data: null, error };
            } else {
              // Reset counter on success
              loginAttempts[email] = { count: 0, lastAttempt: 0 };
              localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));

              set({
                session: data.session,
                user: data.user,
                error: null,
              });

              // Fetch family member data if we have a user
              if (data.user) {
                await fetchFamilyMember(data.user.id);
              }

              return { data: data.session, error: null };
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'An unknown error occurred';
            set({ error: errorMessage });
            return { data: null, error: error as Error };
          } finally {
            set({ loading: false });
          }
        },

        signUp: async (email: string, password: string) => {
          set({ loading: true, error: null });

          try {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
            });

            if (error) {
              set({ error: error.message });
              return { data: null, error };
            }

            set({
              session: data.session,
              user: data.user,
              error: null,
            });

            return { data: data.session, error: null };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'An unknown error occurred';
            set({ error: errorMessage });
            return { data: null, error: error as Error };
          } finally {
            set({ loading: false });
          }
        },

        signOut: async () => {
          set({ loading: true, error: null });

          try {
            await supabase.auth.signOut();
            set({
              session: null,
              user: null,
              familyMember: null,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
            set({ error: errorMessage });
            toast({
              title: 'Error',
              description: errorMessage,
              variant: 'destructive',
            });
          } finally {
            set({ loading: false });
          }
        },

        resetPassword: async (email: string) => {
          set({ loading: true, error: null });

          try {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
              set({ error: error.message });
              return { data: null, error };
            }

            return { data, error: null };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Failed to reset password';
            set({ error: errorMessage });
            return { data: null, error: error as Error };
          } finally {
            set({ loading: false });
          }
        },

        // Data operations
        fetchFamilyMember,

        // Initialize the store
        initialize: () => {
          // Get the current session
          supabase.auth.getSession().then(({ data: { session } }) => {
            set({
              session,
              user: session?.user ?? null,
              loading: false,
            });

            // If we have a user, fetch their family member data
            if (session?.user) {
              fetchFamilyMember(session.user.id);
            }
          });

          // Listen for auth changes
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((_event, session) => {
            set({
              session,
              user: session?.user ?? null,
              loading: false,
            });

            // If we have a user, fetch their family member data
            if (session?.user) {
              fetchFamilyMember(session.user.id);
            } else {
              set({ familyMember: null });
            }
          });

          // Return cleanup function
          return () => {
            subscription.unsubscribe();
          };
        },
      };
    },
    {
      name: 'auth-storage',
      partialize: state => ({
        // Only persist these fields
        session: state.session,
        user: state.user,
        familyMember: state.familyMember,
      }),
    }
  )
);
