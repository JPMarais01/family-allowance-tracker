import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
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
  // Start with loading false, we'll set it to true when we actually start fetching
  const [loading, setLoading] = useState(false);

  // Add a ref to track the previous family member ID
  const prevFamilyMemberIdRef = useRef<string | null>(null);

  // Fetch all family data
  const fetchFamilyData = useCallback(
    async (familyId: string) => {
      // Skip if we're already loading or if we already have this family's data
      if (loading || (family && family.id === familyId)) {
        return;
      }

      // Set a flag to prevent concurrent fetches
      setLoading(true);

      try {
        // Fetch family details
        const familyDetails = await familyData.getFamilyById(familyId);

        // Only update state if we got valid data
        if (familyDetails) {
          // Store the family details first
          setFamily(familyDetails);

          // Fetch family members
          let members: FamilyMember[] = [];
          try {
            members = await familyData.getFamilyMembers(familyId);
            // Only update if we got a valid array
            if (Array.isArray(members)) {
              setFamilyMembers(members);
            }
          } catch {
            // Don't clear existing members on error
          }

          // Fetch family settings
          try {
            const settings = await familyData.getFamilySettings(familyId);
            // Only update if we got valid settings
            if (settings) {
              setFamilySettings(settings);
            }
          } catch {
            // Don't clear existing settings on error
          }
        }
      } catch {
        // Don't clear existing data on error - this prevents data from disappearing
      } finally {
        setLoading(false);
      }
    },
    [familyData, loading, family]
  );

  // Fetch family data on mount or when user/familyMember changes
  useEffect(() => {
    // Initialize loading state based on whether we need to fetch data
    const currentFamilyMemberId = familyMember?.id || null;
    const currentFamilyId = familyMember?.family_id || null;

    // Case 1: We have a user and family member with a family ID
    if (user && familyMember && currentFamilyId) {
      // Check if we need to fetch data
      const shouldFetchData =
        !family ||
        family.id !== currentFamilyId ||
        prevFamilyMemberIdRef.current !== currentFamilyMemberId;

      if (shouldFetchData) {
        // Update the ref before fetching
        prevFamilyMemberIdRef.current = currentFamilyMemberId;
        fetchFamilyData(currentFamilyId);
      } else if (loading) {
        // If we don't need to fetch but loading is still true, reset it
        setLoading(false);
      }
    }
    // Case 2: No user or family member
    else if (!user || !familyMember) {
      // Reset family data when user logs out or has no family member
      if (family !== null) {
        setFamily(null);
        setFamilyMembers([]);
        setFamilySettings(null);
      }

      // Always ensure loading is false when there's no data to fetch
      if (loading) {
        setLoading(false);
      }
    }
  }, [user, familyMember, fetchFamilyData, family, loading]);

  // Initial data fetch on mount
  useEffect(() => {
    // If we have a user and family member on mount, trigger a fetch
    if (user && familyMember && familyMember.family_id && !family) {
      prevFamilyMemberIdRef.current = familyMember.id;
      fetchFamilyData(familyMember.family_id);
    } else if (!loading) {
      // Make sure loading is false if we're not fetching, but don't reset existing data
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array for mount only

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
      } catch {
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
      } catch {
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
      } catch {
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
      } catch {
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
