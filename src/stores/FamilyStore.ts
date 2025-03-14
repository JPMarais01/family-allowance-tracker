import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import {
  AddFamilyMemberInput,
  Family,
  FamilyMember,
  FamilySettings,
  UpdateFamilyMemberInput,
} from '../lib/types';
import { useUserStore } from './UserStore';

interface FamilyState {
  // State
  family: Family | null;
  familyMembers: FamilyMember[];
  familySettings: FamilySettings | null;
  loading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setFamily: (family: Family | null) => void;
  setFamilyMembers: (members: FamilyMember[]) => void;
  setFamilySettings: (settings: FamilySettings | null) => void;
  setError: (error: string | null) => void;

  // Async actions
  fetchFamilyData: (familyId: string) => Promise<void>;
  createFamily: (name: string) => Promise<Family | null>;
  addFamilyMember: (input: AddFamilyMemberInput) => Promise<FamilyMember | null>;
  updateFamilyMember: (input: UpdateFamilyMemberInput) => Promise<FamilyMember | null>;
  deleteFamilyMember: (memberId: string) => Promise<boolean>;
  refreshFamilyData: () => Promise<void>;

  // Initialize store
  initialize: () => () => void;
}

export const useFamilyStore = create<FamilyState>()((set, get) => ({
  // Initial state
  family: null,
  familyMembers: [],
  familySettings: null,
  loading: false,
  error: null,

  // Basic state setters
  setLoading: (loading: boolean) => set({ loading }),
  setFamily: (family: Family | null) => set({ family }),
  setFamilyMembers: (familyMembers: FamilyMember[]) => set({ familyMembers }),
  setFamilySettings: (familySettings: FamilySettings | null) => set({ familySettings }),
  setError: (error: string | null) => set({ error }),

  // Initialize store and subscribe to user changes
  initialize: () => {
    const unsubscribe = useUserStore.getState().subscribe(async user => {
      // Reset state when user logs out
      if (!user) {
        set({
          family: null,
          familyMembers: [],
          familySettings: null,
          error: null,
        });
        return;
      }

      // Load initial family data
      set({ loading: true });
      try {
        // First try to find a direct family member record
        const { data: familyMember, error: memberError } = await supabase
          .from('family_members')
          .select('family_id')
          .eq('user_id', user.id)
          .single();

        console.log('familyStore | initialize | familyMember', familyMember);
        console.log('familyStore | initialize | memberError', memberError);

        if (!memberError && familyMember?.family_id) {
          set({ loading: false });
          await get().fetchFamilyData(familyMember.family_id);
          return;
        }
      } catch (error) {
        set({ error: 'Failed to load family data' });
        console.error('Error loading family data:', error);
      } finally {
        set({ loading: false });
      }
    });

    // Clean up subscription on store destruction
    return () => unsubscribe();
  },

  // Async actions
  fetchFamilyData: async (familyId: string) => {
    const { loading, family } = get();

    console.log('familyStore | fetchFamilyData | loading', loading);
    console.log('familyStore | fetchFamilyData | family', family);

    // Skip if already loading or if we already have this family's data
    if (loading || (family && family.id === familyId)) {
      return;
    }

    set({ loading: true, error: null });

    try {
      // Fetch family details
      const { data: familyDetails, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      console.log('familyStore | fetchFamilyData | familyDetails', familyDetails);

      if (familyError) {
        throw familyError;
      }

      if (familyDetails) {
        set({ family: familyDetails });

        // Fetch family members
        try {
          const { data: members } = await supabase
            .from('family_members')
            .select('*')
            .eq('family_id', familyId);

          if (Array.isArray(members)) {
            set({ familyMembers: members });
          }

          console.log('familyStore | fetchFamilyData | familyMembers', members);
        } catch {
          // Don't clear existing members on error
        }

        // Fetch family settings
        try {
          const { data: settings } = await supabase
            .from('family_settings')
            .select('*')
            .eq('family_id', familyId)
            .single();

          if (settings) {
            set({ familySettings: settings });
          }

          console.log('familyStore | fetchFamilyData | familySettings', settings);
        } catch {
          // Don't clear existing settings on error
        }
      }
    } catch (error) {
      set({ error: 'Failed to fetch family data' });
      console.error('Error fetching family data:', error);
    } finally {
      set({ loading: false });
    }
  },

  createFamily: async (name: string) => {
    set({ loading: true });
    try {
      const { data: familyData, error } = await supabase
        .from('families')
        .insert([{ name }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (familyData) {
        await get().fetchFamilyData(familyData.id);
      }
      return familyData;
    } catch (error) {
      console.error('Error creating family:', error);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  addFamilyMember: async (input: AddFamilyMemberInput) => {
    const { family } = get();
    if (!family) {
      return null;
    }

    set({ loading: true });
    try {
      const { data: newMember, error } = await supabase
        .from('family_members')
        .insert([{ ...input, family_id: family.id }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (newMember) {
        set(state => ({
          familyMembers: [...state.familyMembers, newMember],
        }));
      }
      return newMember;
    } catch (error) {
      console.error('Error adding family member:', error);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  updateFamilyMember: async (input: UpdateFamilyMemberInput) => {
    set({ loading: true });
    try {
      const { data: updatedMember, error } = await supabase
        .from('family_members')
        .update(input)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (updatedMember) {
        set(state => ({
          familyMembers: state.familyMembers.map(member =>
            member.id === updatedMember.id ? updatedMember : member
          ),
        }));
      }
      return updatedMember;
    } catch (error) {
      console.error('Error updating family member:', error);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  deleteFamilyMember: async (memberId: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.from('family_members').delete().eq('id', memberId);

      if (error) {
        throw error;
      }

      set(state => ({
        familyMembers: state.familyMembers.filter(member => member.id !== memberId),
      }));
      return true;
    } catch (error) {
      console.error('Error deleting family member:', error);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  refreshFamilyData: async () => {
    const { family } = get();
    if (family) {
      await get().fetchFamilyData(family.id);
    }
  },
}));
