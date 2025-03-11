import { User } from '@supabase/supabase-js';
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  AddFamilyMemberInput,
  BudgetCycle,
  CreateFamilyInput,
  DailyScore,
  Family,
  FamilyMember,
  FamilySettings,
  SaveDailyScoreInput,
  UpdateFamilyMemberInput,
} from '../lib/types';
import { formatDate } from '../lib/utils';
import { toast } from './use-toast';

// Define the return type for the hook
type UseFamilyDataReturn = {
  loading: boolean;
  getFamilyByOwnerId: () => Promise<Family | null>;
  getFamilyById: (familyId: string) => Promise<Family | null>;
  createFamily: (input: CreateFamilyInput) => Promise<Family | null>;
  getFamilyMembers: (familyId: string) => Promise<FamilyMember[]>;
  addFamilyMember: (familyId: string, input: AddFamilyMemberInput) => Promise<FamilyMember | null>;
  updateFamilyMember: (input: UpdateFamilyMemberInput) => Promise<FamilyMember | null>;
  deleteFamilyMember: (memberId: string) => Promise<boolean>;
  getFamilySettings: (familyId: string) => Promise<FamilySettings | null>;
  // New score-related functions
  getDailyScores: (familyMemberId: string, startDate: Date, endDate: Date) => Promise<DailyScore[]>;
  getDailyScore: (familyMemberId: string, date: Date) => Promise<DailyScore | null>;
  saveDailyScore: (input: SaveDailyScoreInput) => Promise<DailyScore | null>;
  deleteDailyScore: (scoreId: string) => Promise<boolean>;
  getBudgetCycleForDate: (familyId: string, date: Date) => Promise<BudgetCycle | null>;
  createBudgetCycle: (
    familyId: string,
    currentDate: Date,
    cycleStartDay: number
  ) => Promise<BudgetCycle | null>;
};

// Accept user as a parameter instead of using useAuth
export function useFamilyData(user: User | null = null): UseFamilyDataReturn {
  const [loading, setLoading] = useState(false);

  // Get family by owner ID
  const getFamilyByOwnerId = useCallback(async (): Promise<Family | null> => {
    if (!user) {
      return null;
    }

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
      if (!user) {
        return null;
      }

      if (!familyId) {
        return null;
      }

      try {
        setLoading(true);

        // First check if the user is a member of this family
        const { error: memberError } = await supabase
          .from('family_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('family_id', familyId)
          .single();

        if (memberError && memberError.code === 'PGRST116') {
          return null;
        }

        // Now fetch the family data
        const { data, error } = await supabase
          .from('families')
          .select('*')
          .eq('id', familyId)
          .single();

        if (error) {
          // Check if it's a "not found" error
          if (error.code === 'PGRST116') {
            return null;
          }

          toast({
            title: 'Error',
            description: 'Failed to fetch family data',
            variant: 'destructive',
          });
          return null;
        }

        return data;
      } catch {
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
      if (!user) {
        return null;
      }

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
      if (!user) {
        return [];
      }

      if (!familyId) {
        return [];
      }

      try {
        setLoading(true);

        // First check if the user is a member of this family and get their role
        const { error: memberError } = await supabase
          .from('family_members')
          .select('*')
          .eq('user_id', user.id)
          .eq('family_id', familyId)
          .single();

        if (memberError && memberError.code === 'PGRST116') {
          return [];
        }

        // Now fetch all family members
        const { data, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_id', familyId);

        if (error) {
          toast({
            title: 'Error',
            description: 'Failed to fetch family members',
            variant: 'destructive',
          });
          return [];
        }

        return data || [];
      } catch {
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
      if (!user) {
        return null;
      }

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
      if (!user) {
        return null;
      }

      try {
        setLoading(true);

        const updates: Partial<FamilyMember> = {};
        if (input.name) {
          updates.name = input.name;
        }
        if (input.role) {
          updates.role = input.role;
          if (input.role === 'parent') {
            updates.base_allowance = null;
          }
        }
        if (input.base_allowance !== undefined && (!input.role || input.role === 'child')) {
          updates.base_allowance = input.base_allowance;
        }

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
      if (!user) {
        return false;
      }

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
      if (!user) {
        return null;
      }

      if (!familyId) {
        return null;
      }

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('family_settings')
          .select('*')
          .eq('family_id', familyId)
          .single();

        if (error) {
          // Check if it's a "not found" error
          if (error.code === 'PGRST116') {
            return null;
          }

          toast({
            title: 'Error',
            description: 'Failed to fetch family settings',
            variant: 'destructive',
          });
          return null;
        }

        return data;
      } catch {
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

  // Get daily scores for a family member within a date range
  const getDailyScores = useCallback(
    async (familyMemberId: string, startDate: Date, endDate: Date): Promise<DailyScore[]> => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('daily_scores')
          .select('*')
          .eq('family_member_id', familyMemberId)
          .gte('date', formatDate(startDate))
          .lte('date', formatDate(endDate))
          .order('date', { ascending: true });

        if (error) {
          console.error('Error fetching daily scores:', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch daily scores',
            variant: 'destructive',
          });
          return [];
        }

        return data || [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get a single daily score for a family member on a specific date
  const getDailyScore = useCallback(
    async (familyMemberId: string, date: Date): Promise<DailyScore | null> => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('daily_scores')
          .select('*')
          .eq('family_member_id', familyMemberId)
          .eq('date', formatDate(date))
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned, which is fine
            return null;
          }
          console.error('Error fetching daily score:', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch daily score',
            variant: 'destructive',
          });
          return null;
        }

        return data;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Save a daily score (create or update)
  const saveDailyScore = useCallback(
    async (input: SaveDailyScoreInput): Promise<DailyScore | null> => {
      try {
        setLoading(true);

        // If this is a vacation day, we need to get the default vacation score from family settings
        let scoreToUse = input.score;
        if (input.is_vacation) {
          // We need to get the family ID first
          const { data: memberData, error: memberError } = await supabase
            .from('family_members')
            .select('family_id')
            .eq('id', input.family_member_id)
            .single();

          if (memberError) {
            console.error('Error fetching family member:', memberError);
          } else if (memberData) {
            const settings = await getFamilySettings(memberData.family_id);
            if (settings && settings.vacation_default_score !== null) {
              scoreToUse = settings.vacation_default_score;
            }
          }
        }

        if (input.id) {
          // Update existing score
          const { data, error } = await supabase
            .from('daily_scores')
            .update({
              score: scoreToUse,
              is_vacation: input.is_vacation,
              notes: input.notes || null,
            })
            .eq('id', input.id)
            .select()
            .single();

          if (error) {
            console.error('Error updating daily score:', error);
            toast({
              title: 'Error',
              description: 'Failed to update daily score',
              variant: 'destructive',
            });
            return null;
          }

          toast({
            title: 'Success',
            description: 'Daily score updated successfully',
          });
          return data;
        } else {
          // Create new score
          const { data, error } = await supabase
            .from('daily_scores')
            .insert({
              family_member_id: input.family_member_id,
              budget_cycle_id: input.budget_cycle_id,
              score: scoreToUse,
              date: input.date,
              is_vacation: input.is_vacation,
              notes: input.notes || null,
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating daily score:', error);
            toast({
              title: 'Error',
              description: 'Failed to create daily score',
              variant: 'destructive',
            });
            return null;
          }

          toast({
            title: 'Success',
            description: 'Daily score saved successfully',
          });
          return data;
        }
      } finally {
        setLoading(false);
      }
    },
    [getFamilySettings]
  );

  // Delete a daily score
  const deleteDailyScore = useCallback(async (scoreId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase.from('daily_scores').delete().eq('id', scoreId);

      if (error) {
        console.error('Error deleting daily score:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete daily score',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Success',
        description: 'Daily score deleted successfully',
      });
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new budget cycle
  const createBudgetCycle = useCallback(
    async (
      familyId: string,
      currentDate: Date,
      cycleStartDay: number
    ): Promise<BudgetCycle | null> => {
      try {
        setLoading(true);

        // Calculate the start and end dates for the budget cycle
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // Note: JavaScript months are 0-indexed (0=Jan, 1=Feb, 2=Mar, etc.)
        const day = currentDate.getDate();

        let startDate: Date;
        let endDate: Date;

        if (day >= cycleStartDay) {
          // We're in the current cycle that started in the current month
          startDate = new Date(year, month, cycleStartDay);
          // End date is the day before the start day in the next month
          endDate = new Date(year, month + 1, cycleStartDay - 1);
        } else {
          // We're in a cycle that started in the previous month
          startDate = new Date(year, month - 1, cycleStartDay);
          // End date is the day before the start day in the current month
          endDate = new Date(year, month, cycleStartDay - 1);
        }

        // Handle month/year rollover for date calculations
        // This ensures we get the correct date even when dealing with different month lengths
        // or when the cycleStartDay might not exist in certain months (like 31 in February)
        startDate = new Date(startDate);
        endDate = new Date(endDate);

        // Format dates for Supabase
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        // First check if a budget cycle with these dates already exists
        const { data: existingCycle, error: checkError } = await supabase
          .from('budget_cycles')
          .select('*')
          .eq('family_id', familyId)
          .eq('start_date', formattedStartDate)
          .eq('end_date', formattedEndDate)
          .single();

        if (!checkError && existingCycle) {
          return existingCycle;
        }

        // Create the budget cycle
        const { data, error } = await supabase
          .from('budget_cycles')
          .insert({
            family_id: familyId,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating budget cycle:', error);
          toast({
            title: 'Error',
            description: 'Failed to create budget cycle',
            variant: 'destructive',
          });
          return null;
        }

        return data;
      } catch (error) {
        console.error('Unexpected error creating budget cycle:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while creating budget cycle',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get the budget cycle for a specific date
  const getBudgetCycleForDate = useCallback(
    async (familyId: string, date: Date): Promise<BudgetCycle | null> => {
      try {
        setLoading(true);
        const formattedDate = formatDate(date);

        // First, check if a budget cycle exists for this date
        const { data, error } = await supabase
          .from('budget_cycles')
          .select('*')
          .eq('family_id', familyId)
          .lte('start_date', formattedDate)
          .gte('end_date', formattedDate)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No budget cycle found, create one
            const settings = await getFamilySettings(familyId);
            if (!settings) {
              console.error('No family settings found');
              return null;
            }

            // Show a warning toast that we're creating a new budget cycle
            toast({
              title: 'Creating New Budget Period',
              description:
                'No budget period found for this date. Creating a new one automatically.',
              variant: 'default',
            });

            // Create a new budget cycle based on the settings
            const newBudgetCycle = await createBudgetCycle(
              familyId,
              date,
              settings.budget_cycle_start_day
            );

            // Verify the budget cycle was created successfully
            if (!newBudgetCycle) {
              console.error('Failed to create new budget cycle');
              toast({
                title: 'Error',
                description: 'Failed to create new budget cycle',
                variant: 'destructive',
              });
              return null;
            }

            return newBudgetCycle;
          }

          console.error('Error fetching budget cycle:', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch budget cycle',
            variant: 'destructive',
          });
          return null;
        }

        return data;
      } catch (error) {
        console.error('Error in getBudgetCycleForDate:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while getting budget cycle',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getFamilySettings, createBudgetCycle]
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
    // New score-related functions
    getDailyScores,
    getDailyScore,
    saveDailyScore,
    deleteDailyScore,
    getBudgetCycleForDate,
    createBudgetCycle,
  };
}
