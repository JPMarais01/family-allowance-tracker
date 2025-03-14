import { User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface UserState {
  // State
  user: User | null;
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Auth actions
  signOut: () => Promise<void>;

  // Subscriptions
  subscribe: (callback: (user: User | null) => void) => () => void;
}

export const useUserStore = create<UserState>()((set, get) => {
  // Store subscriptions
  const subscribers = new Set<(user: User | null) => void>();

  return {
    // Initial state
    user: null,
    loading: true,
    error: null,

    // Basic actions
    setUser: (user: User | null) => {
      set({ user });
      // Notify subscribers
      subscribers.forEach(callback => callback(user));
    },
    setLoading: (loading: boolean) => set({ loading }),
    setError: (error: string | null) => set({ error }),

    // Auth actions
    signOut: async () => {
      set({ loading: true });
      try {
        await supabase.auth.signOut();
        set({ user: null });
      } catch (error) {
        set({ error: 'Failed to sign out' });
        console.error('Error signing out:', error);
      } finally {
        set({ loading: false });
      }
    },

    // Subscription management
    subscribe: (callback: (user: User | null) => void) => {
      subscribers.add(callback);
      // Initial call with current user
      callback(get().user);

      // Return unsubscribe function
      return () => {
        subscribers.delete(callback);
      };
    },
  };
});
