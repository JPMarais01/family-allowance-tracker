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
  fetchScores: () => Promise<void>;
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
  const [familyMemberId, setFamilyMemberId] = useState<string | null>(initialFamilyMemberId);
  // State for scores
  const [scores, setScores] = useState<DailyScore[]>([]);

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
    params.set('view', viewType);
    params.set('date', format(viewDate, 'yyyy-MM-dd'));
    if (familyMemberId) {
      params.set('memberId', familyMemberId);
    } else {
      params.delete('memberId');
    }
    setSearchParams(params);
  }, [viewDate, viewType, familyMemberId, setSearchParams, searchParams]);

  // Fetch scores when date range or family member changes
  const fetchScores = useCallback(async (): Promise<void> => {
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
  }, [calendarData, familyMemberId, startDate, endDate]);

  // Fetch scores when dependencies change
  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

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
        // Get the existing score if any
        const existingScore = getScoreForDay(date);

        // Get the budget cycle
        const budgetCycleId = existingScore?.budget_cycle_id;

        if (!budgetCycleId) {
          throw new Error('Budget cycle not found');
        }

        // Create the score input
        const scoreInput = {
          id: existingScore?.id,
          family_member_id: familyMemberId,
          budget_cycle_id: budgetCycleId,
          score,
          date: format(date, 'yyyy-MM-dd'),
          is_vacation: isVacation,
          notes: notes || '',
        };

        // Save the score
        await calendarData.saveScore(scoreInput);

        // Refresh scores
        await fetchScores();
      } catch (error) {
        console.error('Error saving score:', error);
      }
    },
    [calendarData, familyMemberId, getScoreForDay, fetchScores]
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
      fetchScores,
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
      fetchScores,
      saveScore,
      setVacationDays,
      getScoreForDay,
    ]
  );

  return <CalendarContext.Provider value={contextValue}>{children}</CalendarContext.Provider>;
}

// Export the context for use in the hook
export { CalendarContext };
