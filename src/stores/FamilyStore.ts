import { create } from 'zustand';
import { useFamilyData } from '../hooks/use-family-data';
import {
  AddFamilyMemberInput,
  Family,
  FamilyMember,
  FamilySettings,
  UpdateFamilyMemberInput,
} from '../lib/types';

interface FamilyState {
  family: Family | null;
  familyMembers: FamilyMember[];
  familySettings: FamilySettings | null;
  loading: boolean;

  // Actions
  setLoading: (loading: boolean) => void;
  setFamily: (family: Family | null) => void;
  setFamilyMembers: (members: FamilyMember[]) => void;
  setFamilySettings: (settings: FamilySettings | null) => void;

  // Async actions
  fetchFamilyData: (familyId: string) => Promise<void>;
  createFamily: (name: string) => Promise<Family | null>;
  addFamilyMember: (input: AddFamilyMemberInput) => Promise<FamilyMember | null>;
  updateFamilyMember: (input: UpdateFamilyMemberInput) => Promise<FamilyMember | null>;
  deleteFamilyMember: (memberId: string) => Promise<boolean>;
  refreshFamilyData: () => Promise<void>;
}

export const useFamilyStore = create<FamilyState>()((set, get) => {
  // Initialize the familyData hook
  const familyData = useFamilyData();

  return {
    // Initial state
    family: null,
    familyMembers: [],
    familySettings: null,
    loading: false,

    // Basic state setters
    setLoading: (loading: boolean) => set({ loading }),
    setFamily: (family: Family | null) => set({ family }),
    setFamilyMembers: (familyMembers: FamilyMember[]) => set({ familyMembers }),
    setFamilySettings: (familySettings: FamilySettings | null) => set({ familySettings }),

    // Async actions
    fetchFamilyData: async (familyId: string) => {
      const { loading, family } = get();

      // Skip if already loading or if we already have this family's data
      if (loading || (family && family.id === familyId)) {
        return;
      }

      set({ loading: true });

      try {
        // Fetch family details
        const familyDetails = await familyData.getFamilyById(familyId);

        if (familyDetails) {
          set({ family: familyDetails });

          // Fetch family members
          try {
            const members = await familyData.getFamilyMembers(familyId);
            if (Array.isArray(members)) {
              set({ familyMembers: members });
            }
          } catch {
            // Don't clear existing members on error
          }

          // Fetch family settings
          try {
            const settings = await familyData.getFamilySettings(familyId);
            if (settings) {
              set({ familySettings: settings });
            }
          } catch {
            // Don't clear existing settings on error
          }
        }
      } catch {
        // Don't clear existing data on error
      } finally {
        set({ loading: false });
      }
    },

    createFamily: async (name: string) => {
      set({ loading: true });
      try {
        const newFamily = await familyData.createFamily({ name });
        if (newFamily) {
          await get().fetchFamilyData(newFamily.id);
        }
        return newFamily;
      } catch {
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
        const newMember = await familyData.addFamilyMember(family.id, input);
        if (newMember) {
          set(state => ({
            familyMembers: [...state.familyMembers, newMember],
          }));
        }
        return newMember;
      } catch {
        return null;
      } finally {
        set({ loading: false });
      }
    },

    updateFamilyMember: async (input: UpdateFamilyMemberInput) => {
      set({ loading: true });
      try {
        const updatedMember = await familyData.updateFamilyMember(input);
        if (updatedMember) {
          set(state => ({
            familyMembers: state.familyMembers.map(member =>
              member.id === updatedMember.id ? updatedMember : member
            ),
          }));
        }
        return updatedMember;
      } catch {
        return null;
      } finally {
        set({ loading: false });
      }
    },

    deleteFamilyMember: async (memberId: string) => {
      set({ loading: true });
      try {
        const success = await familyData.deleteFamilyMember(memberId);
        if (success) {
          set(state => ({
            familyMembers: state.familyMembers.filter(member => member.id !== memberId),
          }));
        }
        return success;
      } catch {
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
  };
});
