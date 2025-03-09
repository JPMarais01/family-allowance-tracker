import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { useFamilyData } from '../hooks/use-family-data';
import {
  AddFamilyMemberInput,
  Family,
  FamilyMember,
  FamilySettings,
  UpdateFamilyMemberInput,
} from '../lib/types';
import { FamilyContext } from './family-context-types';

// Provider component
export function FamilyProvider({ children }: { children: ReactNode }): React.ReactElement {
  const { user, familyMember } = useAuth();
  // Call the hook directly
  const familyData = useFamilyData(user);

  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familySettings, setFamilySettings] = useState<FamilySettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all family data
  const fetchFamilyData = useCallback(
    async (familyId: string) => {
      // Skip if we're already loading or if we already have this family's data
      if (loading || (family && family.id === familyId)) {
        return;
      }

      setLoading(true);
      try {
        // Fetch family details
        const familyDetails = await familyData.getFamilyById(familyId);
        setFamily(familyDetails);

        // Fetch family members
        const members = await familyData.getFamilyMembers(familyId);
        setFamilyMembers(members);

        // Fetch family settings
        const settings = await familyData.getFamilySettings(familyId);
        setFamilySettings(settings);
      } catch (error) {
        console.error('Error fetching family data:', error);
      } finally {
        setLoading(false);
      }
    },
    [familyData, loading, family]
  );

  // Fetch family data on mount or when user/familyMember changes
  useEffect(() => {
    // Only fetch if we have user and familyMember AND we don't already have family data
    // or if the family ID has changed
    if (user && familyMember && (!family || family.id !== familyMember.family_id)) {
      fetchFamilyData(familyMember.family_id);
    } else if (!user || !familyMember) {
      setLoading(false);
    }
  }, [user, familyMember, fetchFamilyData, family]);

  // Refresh family data
  const refreshFamilyData = useCallback(async () => {
    if (family) {
      await fetchFamilyData(family.id);
    }
  }, [family, fetchFamilyData]);

  // Create a new family
  const createFamily = useCallback(
    async (name: string): Promise<Family | null> => {
      setLoading(true);
      try {
        const newFamily = await familyData.createFamily({ name });
        if (newFamily) {
          await fetchFamilyData(newFamily.id);
        }
        return newFamily;
      } catch (error) {
        console.error('Error creating family:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [familyData, fetchFamilyData]
  );

  // Add a family member
  const addFamilyMember = useCallback(
    async (input: AddFamilyMemberInput): Promise<FamilyMember | null> => {
      if (!family) {
        return null;
      }

      setLoading(true);
      try {
        const newMember = await familyData.addFamilyMember(family.id, input);
        if (newMember) {
          setFamilyMembers(prev => [...prev, newMember]);
        }
        return newMember;
      } catch (error) {
        console.error('Error adding family member:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [family, familyData]
  );

  // Update a family member
  const updateFamilyMember = useCallback(
    async (input: UpdateFamilyMemberInput): Promise<FamilyMember | null> => {
      setLoading(true);
      try {
        const updatedMember = await familyData.updateFamilyMember(input);
        if (updatedMember) {
          setFamilyMembers(prev =>
            prev.map(member => (member.id === updatedMember.id ? updatedMember : member))
          );
        }
        return updatedMember;
      } catch (error) {
        console.error('Error updating family member:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [familyData]
  );

  // Delete a family member
  const deleteFamilyMember = useCallback(
    async (memberId: string): Promise<boolean> => {
      setLoading(true);
      try {
        const success = await familyData.deleteFamilyMember(memberId);
        if (success) {
          setFamilyMembers(prev => prev.filter(member => member.id !== memberId));
        }
        return success;
      } catch (error) {
        console.error('Error deleting family member:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [familyData]
  );

  const value = {
    family,
    familyMembers,
    familySettings,
    loading,
    createFamily,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    refreshFamilyData,
  };

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}
