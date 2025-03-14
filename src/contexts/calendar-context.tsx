import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import * as React from 'react';
import { ReactNode, createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { useCalendarData } from '../hooks/use-calendar-data';
import { supabase } from '../lib/supabase';
import { DailyScore } from '../lib/types';

// Define the calendar view type
export type CalendarView = 'month' | 'week';

// Define the context type
export interface CalendarContextType {
  // View state
  viewDate: Date;
  viewType: CalendarView;
  selectedDate: Date | null;
  startDate: Date;
  endDate: Date;
  familyMemberId: string | null;

  // Data state
  scores: DailyScore[];
  loading: boolean;
  error: string | null;

  // Actions
  setViewDate: (date: Date) => void;
  setViewType: (type: CalendarView) => void;
  setSelectedDate: (date: Date | null) => void;
  setFamilyMemberId: (id: string | null) => void;

  // Navigation
  goToPreviousPeriod: () => void;
  goToNextPeriod: () => void;
  goToToday: () => void;

  // Data operations
  fetchScores: (force?: boolean) => Promise<void>;
  saveScore: (score: number, date: Date, isVacation: boolean, notes?: string) => Promise<void>;
  setVacationDays: (startDate: Date, endDate: Date, isVacation: boolean) => Promise<void>;

  // Utility
  getScoreForDay: (day: Date) => DailyScore | undefined;
}

// Create the context with a default value
const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

// Provider component
export function CalendarProvider({ children }: { children: ReactNode }): React.ReactElement {
  const { user } = useAuth();
  const calendarData = useCalendarData(user);
  const [searchParams, setSearchParams] = useSearchParams();

  // Add a ref to track the last fetch parameters
  const lastFetchRef = React.useRef<string | null>(null);
  // Add a ref to track the URL update timer
  const urlUpdateTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize state from URL parameters or defaults
  const initialViewType = (searchParams.get('view') as CalendarView) || 'month';
  const initialViewDate = searchParams.get('date')
    ? new Date(searchParams.get('date') as string)
    : new Date();
  const initialFamilyMemberId = searchParams.get('memberId') || null;

  // State for the current view date (month/week being viewed)
  const [viewDate, setViewDate] = useState<Date>(initialViewDate);
  // State for the calendar view type (month or week)
  const [viewType, setViewType] = useState<CalendarView>(initialViewType);
  // State for the selected date (day that is clicked/selected)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // State for the family member being viewed
  const [familyMemberId, setFamilyMemberIdState] = useState<string | null>(initialFamilyMemberId);
  // State for scores
  const [scores, setScores] = useState<DailyScore[]>([]);

  // Custom setter for familyMemberId to prevent unnecessary updates
  const setFamilyMemberId = useCallback(
    (id: string | null): void => {
      if (id !== familyMemberId) {
        // Reset the lastFetchRef to force a new fetch when family member changes
        lastFetchRef.current = null;
        setFamilyMemberIdState(id);
      }
    },
    [familyMemberId]
  );

  // Calculate start and end dates based on view type and date
  const { startDate, endDate } = useMemo(() => {
    if (viewType === 'month') {
      return {
        startDate: startOfMonth(viewDate),
        endDate: endOfMonth(viewDate),
      };
    } else {
      return {
        startDate: startOfWeek(viewDate, { weekStartsOn: 0 }),
        endDate: endOfWeek(viewDate, { weekStartsOn: 0 }),
      };
    }
  }, [viewDate, viewType]);

  // Update URL parameters when state changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const currentView = params.get('view');
    const currentDate = params.get('date');
    const currentMemberId = params.get('memberId');

    // Only update if values have actually changed
    let hasChanges = false;

    if (currentView !== viewType) {
      params.set('view', viewType);
      hasChanges = true;
    }

    const formattedDate = format(viewDate, 'yyyy-MM-dd');
    if (currentDate !== formattedDate) {
      params.set('date', formattedDate);
      hasChanges = true;
    }

    if (familyMemberId && currentMemberId !== familyMemberId) {
      params.set('memberId', familyMemberId);
      hasChanges = true;
    } else if (!familyMemberId && currentMemberId) {
      params.delete('memberId');
      hasChanges = true;
    }

    // Only update search params if there are actual changes
    if (hasChanges) {
      // Clear any existing timer
      if (urlUpdateTimerRef.current) {
        clearTimeout(urlUpdateTimerRef.current);
      }

      // Debounce URL updates to prevent rapid consecutive updates
      urlUpdateTimerRef.current = setTimeout(() => {
        setSearchParams(params);
        urlUpdateTimerRef.current = null;
      }, 300); // 300ms debounce
    }

    // Cleanup function
    return () => {
      if (urlUpdateTimerRef.current) {
        clearTimeout(urlUpdateTimerRef.current);
        urlUpdateTimerRef.current = null;
      }
    };
  }, [viewDate, viewType, familyMemberId, setSearchParams, searchParams]);

  // Fetch scores when date range or family member changes
  const fetchScores = useCallback(
    async (_force: boolean = false): Promise<void> => {
      if (!familyMemberId) {
        setScores([]);
        return;
      }

      try {
        const fetchedScores = await calendarData.fetchScoresForDateRange(
          familyMemberId,
          startDate,
          endDate
        );
        setScores(fetchedScores);
      } catch (error) {
        console.error('Error fetching scores:', error);
      }
    },
    [calendarData, familyMemberId, startDate, endDate]
  );

  // Fetch scores when dependencies change
  useEffect(() => {
    if (familyMemberId) {
      fetchScores();
    } else {
      setScores([]);
    }
  }, [familyMemberId, startDate, endDate, fetchScores]);

  // Get score for a specific day
  const getScoreForDay = useCallback(
    (day: Date): DailyScore | undefined => {
      const dayString = format(day, 'yyyy-MM-dd');
      return scores.find(score => score.date === dayString);
    },
    [scores]
  );

  // Save a score for a specific day
  const saveScore = useCallback(
    async (score: number, date: Date, isVacation: boolean, notes?: string): Promise<void> => {
      if (!familyMemberId) {
        return;
      }

      try {
        const existingScore = getScoreForDay(date);
        const formattedDate = format(date, 'yyyy-MM-dd');

        if (existingScore) {
          // Update existing score
          await calendarData.saveScore({
            id: existingScore.id,
            family_member_id: familyMemberId,
            budget_cycle_id: existingScore.budget_cycle_id,
            score,
            date: formattedDate,
            is_vacation: isVacation,
            notes: notes || '',
          });
        } else {
          // Get family member's family ID
          const { data: memberData } = await supabase
            .from('family_members')
            .select('family_id')
            .eq('id', familyMemberId)
            .single();

          if (!memberData) {
            throw new Error('Could not find family member');
          }

          // Get budget cycle
          const { data: cycleData } = await supabase
            .from('budget_cycles')
            .select('*')
            .eq('family_id', memberData.family_id)
            .lte('start_date', formattedDate)
            .gte('end_date', formattedDate)
            .single();

          if (!cycleData?.id) {
            throw new Error('Could not find budget cycle');
          }

          // Save new score
          await calendarData.saveScore({
            family_member_id: familyMemberId,
            budget_cycle_id: cycleData.id,
            score,
            date: formattedDate,
            is_vacation: isVacation,
            notes: notes || '',
          });
        }

        // Update scores immediately
        const updatedScores = await calendarData.fetchScoresForDateRange(
          familyMemberId,
          startDate,
          endDate
        );
        setScores(updatedScores);
      } catch (error) {
        console.error('Error saving score:', error);
        throw error;
      }
    },
    [calendarData, familyMemberId, getScoreForDay, startDate, endDate]
  );

  // Set vacation days for a date range
  const setVacationDays = useCallback(
    async (startDate: Date, endDate: Date, isVacation: boolean): Promise<void> => {
      if (!familyMemberId) {
        return;
      }

      try {
        await calendarData.setVacationDays(familyMemberId, startDate, endDate, isVacation);

        // Refresh scores
        await fetchScores();
      } catch (error) {
        console.error('Error setting vacation days:', error);
      }
    },
    [calendarData, familyMemberId, fetchScores]
  );

  // Navigation functions
  const goToPreviousPeriod = useCallback((): void => {
    setViewDate(prevDate => {
      return viewType === 'month' ? subMonths(prevDate, 1) : subWeeks(prevDate, 1);
    });
  }, [viewType]);

  const goToNextPeriod = useCallback((): void => {
    setViewDate(prevDate => {
      return viewType === 'month' ? addMonths(prevDate, 1) : addWeeks(prevDate, 1);
    });
  }, [viewType]);

  const goToToday = useCallback((): void => {
    setViewDate(new Date());
  }, []);

  // Create the context value with a more focused dependency array
  // We need to ensure fetchScores doesn't cause unnecessary context updates
  const fetchScoresStable = useCallback(
    async (force?: boolean): Promise<void> => {
      await fetchScores(force);
    },
    [fetchScores]
  );

  // Create the context value
  const contextValue = useMemo(
    () => ({
      viewDate,
      viewType,
      selectedDate,
      startDate,
      endDate,
      familyMemberId,
      scores,
      loading: calendarData.loading,
      error: calendarData.error,
      setViewDate,
      setViewType,
      setSelectedDate,
      setFamilyMemberId,
      goToPreviousPeriod,
      goToNextPeriod,
      goToToday,
      fetchScores: fetchScoresStable,
      saveScore,
      setVacationDays,
      getScoreForDay,
    }),
    [
      viewDate,
      viewType,
      selectedDate,
      startDate,
      endDate,
      familyMemberId,
      scores,
      calendarData.loading,
      calendarData.error,
      setViewDate,
      setViewType,
      setSelectedDate,
      setFamilyMemberId,
      goToPreviousPeriod,
      goToNextPeriod,
      goToToday,
      fetchScoresStable,
      saveScore,
      setVacationDays,
      getScoreForDay,
    ]
  );

  return <CalendarContext.Provider value={contextValue}>{children}</CalendarContext.Provider>;
}

// Export the context for use in the hook
export { CalendarContext };
