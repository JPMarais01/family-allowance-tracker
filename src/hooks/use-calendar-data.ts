import { User } from '@supabase/supabase-js';
import { eachDayOfInterval, format } from 'date-fns';
import { useCallback, useState } from 'react';
import { DailyScore, SaveDailyScoreInput } from '../lib/types';
import { useFamilyData } from './use-family-data';
import { toast } from './use-toast';

// Define the return type for the hook
type UseCalendarDataReturn = {
  loading: boolean;
  error: string | null;
  // Score fetching functions
  fetchScoresForDateRange: (
    familyMemberId: string,
    startDate: Date,
    endDate: Date
  ) => Promise<DailyScore[]>;
  fetchScoreForDate: (familyMemberId: string, date: Date) => Promise<DailyScore | null>;
  // Score management functions
  saveScore: (input: SaveDailyScoreInput) => Promise<DailyScore | null>;
  deleteScore: (scoreId: string) => Promise<boolean>;
  // Vacation management functions
  setVacationDays: (
    familyMemberId: string,
    startDate: Date,
    endDate: Date,
    isVacation: boolean,
    defaultScore?: number
  ) => Promise<boolean>;
};

/**
 * Hook for managing calendar-related data operations
 * Provides functions for fetching, saving, and managing scores and vacation days
 */
export function useCalendarData(user: User | null = null): UseCalendarDataReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const familyData = useFamilyData(user);

  /**
   * Fetch scores for a date range for a specific family member
   */
  const fetchScoresForDateRange = useCallback(
    async (familyMemberId: string, startDate: Date, endDate: Date): Promise<DailyScore[]> => {
      if (!familyMemberId) {
        setError('No family member selected');
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        return await familyData.getDailyScores(familyMemberId, startDate, endDate);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch scores';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [familyData]
  );

  /**
   * Fetch a single score for a specific date and family member
   */
  const fetchScoreForDate = useCallback(
    async (familyMemberId: string, date: Date): Promise<DailyScore | null> => {
      if (!familyMemberId) {
        setError('No family member selected');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        return await familyData.getDailyScore(familyMemberId, date);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch score';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [familyData]
  );

  /**
   * Save a daily score (create or update)
   */
  const saveScore = useCallback(
    async (input: SaveDailyScoreInput): Promise<DailyScore | null> => {
      setLoading(true);
      setError(null);

      try {
        const savedScore = await familyData.saveDailyScore(input);
        if (savedScore) {
          toast({
            title: 'Success',
            description: 'Score saved successfully',
          });
        }
        return savedScore;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save score';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [familyData]
  );

  /**
   * Delete a daily score
   */
  const deleteScore = useCallback(
    async (scoreId: string): Promise<boolean> => {
      if (!scoreId) {
        setError('No score ID provided');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const success = await familyData.deleteDailyScore(scoreId);
        if (success) {
          toast({
            title: 'Success',
            description: 'Score deleted successfully',
          });
        }
        return success;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete score';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [familyData]
  );

  /**
   * Set vacation days for a date range
   * This will create or update scores for each day in the range
   */
  const setVacationDays = useCallback(
    async (
      familyMemberId: string,
      startDate: Date,
      endDate: Date,
      isVacation: boolean,
      defaultScore = 3
    ): Promise<boolean> => {
      if (!familyMemberId) {
        setError('No family member selected');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        // Get the family ID from the family member
        const familyMembers = await familyData.getFamilyMembers(familyMemberId);
        const member = familyMembers.find(m => m.id === familyMemberId);

        if (!member) {
          throw new Error('Family member not found');
        }

        // Get the budget cycle for the date range
        const budgetCycle = await familyData.getBudgetCycleForDate(member.family_id, startDate);

        if (!budgetCycle) {
          throw new Error('Budget cycle not found');
        }

        // Generate all dates in the range
        const datesInRange = eachDayOfInterval({ start: startDate, end: endDate });

        // For each date, create or update a score
        const promises = datesInRange.map(async date => {
          // Check if a score already exists for this date
          const existingScore = await familyData.getDailyScore(familyMemberId, date);

          const scoreInput: SaveDailyScoreInput = {
            id: existingScore?.id, // Include ID if updating
            family_member_id: familyMemberId,
            budget_cycle_id: budgetCycle.id,
            score: isVacation ? defaultScore : existingScore?.score || defaultScore,
            date: format(date, 'yyyy-MM-dd'),
            is_vacation: isVacation,
            notes: isVacation ? 'Vacation day' : existingScore?.notes || '',
          };

          return familyData.saveDailyScore(scoreInput);
        });

        // Wait for all updates to complete
        const results = await Promise.all(promises);

        // Check if all operations were successful
        const success = results.every(result => result !== null);

        if (success) {
          toast({
            title: 'Success',
            description: `${isVacation ? 'Set' : 'Unset'} vacation days successfully`,
          });
        }

        return success;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to set vacation days';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [familyData]
  );

  return {
    loading,
    error,
    fetchScoresForDateRange,
    fetchScoreForDate,
    saveScore,
    deleteScore,
    setVacationDays,
  };
}
