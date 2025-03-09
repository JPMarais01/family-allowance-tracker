import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  AddFamilyMemberInput,
  CreateFamilyInput,
  Family,
  FamilyMember,
  FamilySettings,
  UpdateFamilyMemberInput,
} from '../lib/types';
import { useAuth } from './use-auth';
import { toast } from './use-toast';

export function useFamilyData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Get family by owner ID
  const getFamilyByOwnerId = useCallback(async (): Promise<Family | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching family:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch family data',
          variant: 'destructive',
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getFamilyByOwnerId:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Get family by ID
  const getFamilyById = useCallback(
    async (familyId: string): Promise<Family | null> => {
      if (!user) return null;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('families')
          .select('*')
          .eq('id', familyId)
          .single();

        if (error) {
          console.error('Error fetching family:', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch family data',
            variant: 'destructive',
          });
          return null;
        }

        return data;
      } catch (error) {
        console.error('Error in getFamilyById:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Create a new family
  const createFamily = useCallback(
    async (input: CreateFamilyInput): Promise<Family | null> => {
      if (!user) return null;

      try {
        setLoading(true);

        // Create the family
        const { data: familyData, error: familyError } = await supabase
          .from('families')
          .insert([{ name: input.name, owner_id: user.id }])
          .select()
          .single();

        if (familyError) {
          console.error('Error creating family:', familyError);
          toast({
            title: 'Error',
            description: 'Failed to create family',
            variant: 'destructive',
          });
          return null;
        }

        // Create default family settings
        const { error: settingsError } = await supabase.from('family_settings').insert([
          {
            family_id: familyData.id,
            budget_cycle_start_day: 25,
            vacation_default_score: 3,
          },
        ]);

        if (settingsError) {
          console.error('Error creating family settings:', settingsError);
          toast({
            title: 'Warning',
            description: 'Family created but settings could not be initialized',
            variant: 'destructive',
          });
        }

        // Add the current user as a parent member
        const { error: memberError } = await supabase.from('family_members').insert([
          {
            family_id: familyData.id,
            user_id: user.id,
            name: user.email?.split('@')[0] || 'Parent',
            role: 'parent',
          },
        ]);

        if (memberError) {
          console.error('Error adding family member:', memberError);
          toast({
            title: 'Warning',
            description: 'Family created but you could not be added as a member',
            variant: 'destructive',
          });
        }

        toast({
          title: 'Success',
          description: 'Family created successfully',
        });

        return familyData;
      } catch (error) {
        console.error('Error in createFamily:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Get family members
  const getFamilyMembers = useCallback(
    async (familyId: string): Promise<FamilyMember[]> => {
      if (!user) return [];

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', familyId);

        if (error) {
          console.error('Error fetching family members:', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch family members',
            variant: 'destructive',
          });
          return [];
        }

        return data || [];
      } catch (error) {
        console.error('Error in getFamilyMembers:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Add a family member
  const addFamilyMember = useCallback(
    async (familyId: string, input: AddFamilyMemberInput): Promise<FamilyMember | null> => {
      if (!user) return null;

      try {
        setLoading(true);

        const memberData = {
          family_id: familyId,
          name: input.name,
          role: input.role,
          base_allowance: input.role === 'child' ? input.base_allowance || 0 : null,
        };

        const { data, error } = await supabase
          .from('family_members')
          .insert([memberData])
          .select()
          .single();

        if (error) {
          console.error('Error adding family member:', error);
          toast({
            title: 'Error',
            description: 'Failed to add family member',
            variant: 'destructive',
          });
          return null;
        }

        toast({
          title: 'Success',
          description: `${input.name} added to family`,
        });

        return data;
      } catch (error) {
        console.error('Error in addFamilyMember:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Update a family member
  const updateFamilyMember = useCallback(
    async (input: UpdateFamilyMemberInput): Promise<FamilyMember | null> => {
      if (!user) return null;

      try {
        setLoading(true);

        const updates: Partial<FamilyMember> = {};
        if (input.name) updates.name = input.name;
        if (input.role) updates.role = input.role;
        if (input.base_allowance !== undefined) updates.base_allowance = input.base_allowance;

        const { data, error } = await supabase
          .from('family_members')
          .update(updates)
          .eq('id', input.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating family member:', error);
          toast({
            title: 'Error',
            description: 'Failed to update family member',
            variant: 'destructive',
          });
          return null;
        }

        toast({
          title: 'Success',
          description: 'Family member updated',
        });

        return data;
      } catch (error) {
        console.error('Error in updateFamilyMember:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Delete a family member
  const deleteFamilyMember = useCallback(
    async (memberId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        setLoading(true);

        const { error } = await supabase.from('family_members').delete().eq('id', memberId);

        if (error) {
          console.error('Error deleting family member:', error);
          toast({
            title: 'Error',
            description: 'Failed to delete family member',
            variant: 'destructive',
          });
          return false;
        }

        toast({
          title: 'Success',
          description: 'Family member removed',
        });

        return true;
      } catch (error) {
        console.error('Error in deleteFamilyMember:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Get family settings
  const getFamilySettings = useCallback(
    async (familyId: string): Promise<FamilySettings | null> => {
      if (!user) return null;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('family_settings')
          .select('*')
          .eq('family_id', familyId)
          .single();

        if (error) {
          console.error('Error fetching family settings:', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch family settings',
            variant: 'destructive',
          });
          return null;
        }

        return data;
      } catch (error) {
        console.error('Error in getFamilySettings:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    loading,
    getFamilyByOwnerId,
    getFamilyById,
    createFamily,
    getFamilyMembers,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    getFamilySettings,
  };
}
