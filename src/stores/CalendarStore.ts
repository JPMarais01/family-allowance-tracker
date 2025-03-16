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
import { create } from 'zustand';
import { toast } from '../hooks/use-toast';
import { supabase } from '../lib/supabase';
import { DailyScore } from '../lib/types';

export type CalendarView = 'month' | 'week';

export interface CalendarState {
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

  // URL sync state
  urlSyncEnabled: boolean;

  // Actions
  setViewDate: (date: Date) => void;
  setViewType: (type: CalendarView) => void;
  setSelectedDate: (date: Date | null) => void;
  setFamilyMemberId: (id: string | null) => void;
  setUrlSyncEnabled: (enabled: boolean) => void;

  // Navigation
  goToPreviousPeriod: () => void;
  goToNextPeriod: () => void;
  goToToday: () => void;

  // Data operations
  fetchScores: (force?: boolean) => Promise<void>;
  saveScore: (score: number, date: Date, isVacation: boolean, notes?: string) => Promise<void>;
  setVacationDays: (startDate: Date, endDate: Date, isVacation: boolean) => Promise<void>;

  // URL synchronization
  syncWithUrl: (searchParams: URLSearchParams) => void;
  getUrlParams: () => URLSearchParams;

  // Utility
  getScoreForDay: (day: Date) => DailyScore | undefined;
}

export const useCalendarStore = create<CalendarState>()((set, get) => {
  // Calculate start and end dates based on view type and date
  const calculateDateRange = (
    viewDate: Date,
    viewType: CalendarView
  ): { startDate: Date; endDate: Date } => {
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
  };

  return {
    // Initial state
    viewDate: new Date(),
    viewType: 'month',
    selectedDate: null,
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    familyMemberId: null,
    scores: [],
    loading: false,
    error: null,
    urlSyncEnabled: true,

    // Actions
    setViewDate: (date: Date) => {
      const { startDate, endDate } = calculateDateRange(date, get().viewType);
      set({ viewDate: date, startDate, endDate });
    },

    setViewType: (type: CalendarView) => {
      const { startDate, endDate } = calculateDateRange(get().viewDate, type);
      set({ viewType: type, startDate, endDate });
    },

    setSelectedDate: (date: Date | null) => set({ selectedDate: date }),

    setFamilyMemberId: async (id: string | null) => {
      const currentId = get().familyMemberId;
      if (currentId !== id) {
        set({ familyMemberId: id, scores: [] });
        if (id) {
          await get().fetchScores(true);
        }
      }
    },

    setUrlSyncEnabled: (enabled: boolean) => set({ urlSyncEnabled: enabled }),

    // Navigation
    goToPreviousPeriod: () => {
      const { viewDate, viewType } = get();
      const newDate = viewType === 'month' ? subMonths(viewDate, 1) : subWeeks(viewDate, 1);
      get().setViewDate(newDate);
      get().fetchScores();
    },

    goToNextPeriod: () => {
      const { viewDate, viewType } = get();
      const newDate = viewType === 'month' ? addMonths(viewDate, 1) : addWeeks(viewDate, 1);
      get().setViewDate(newDate);
      get().fetchScores();
    },

    goToToday: () => {
      get().setViewDate(new Date());
      get().fetchScores();
    },

    // URL synchronization
    syncWithUrl: (searchParams: URLSearchParams) => {
      const viewType = searchParams.get('view') as CalendarView;
      const dateParam = searchParams.get('date');
      const memberId = searchParams.get('memberId');

      // Only update if values are different from current state
      const currentState = get();
      let stateChanged = false;

      if (
        viewType &&
        viewType !== currentState.viewType &&
        (viewType === 'month' || viewType === 'week')
      ) {
        stateChanged = true;
        get().setViewType(viewType);
      }

      if (dateParam) {
        try {
          const date = new Date(dateParam);
          if (
            !isNaN(date.getTime()) &&
            format(date, 'yyyy-MM-dd') !== format(currentState.viewDate, 'yyyy-MM-dd')
          ) {
            stateChanged = true;
            get().setViewDate(date);
          }
        } catch (error) {
          console.error('Invalid date in URL:', dateParam, error);
        }
      }

      if (memberId !== currentState.familyMemberId) {
        stateChanged = true;
        get().setFamilyMemberId(memberId);
      }

      // Fetch scores if state changed
      if (stateChanged && currentState.familyMemberId) {
        get().fetchScores();
      }
    },

    getUrlParams: () => {
      const { viewType, viewDate, familyMemberId } = get();
      const params = new URLSearchParams();

      params.set('view', viewType);
      params.set('date', format(viewDate, 'yyyy-MM-dd'));

      if (familyMemberId) {
        params.set('memberId', familyMemberId);
      }

      return params;
    },

    // Data operations
    fetchScores: async (force = false) => {
      const { loading, familyMemberId, startDate, endDate } = get();

      if (!familyMemberId || (loading && !force)) {
        return;
      }

      set({ loading: true, error: null });

      try {
        const { data: scores, error } = await supabase
          .from('daily_scores')
          .select('*')
          .eq('family_member_id', familyMemberId)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'));

        if (error) {
          throw error;
        }

        set({ scores: scores || [] });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch scores';
        set({ error: message });
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        set({ loading: false });
      }
    },

    saveScore: async (score: number, date: Date, isVacation: boolean, notes?: string) => {
      const { familyMemberId } = get();
      if (!familyMemberId) {
        return;
      }

      set({ loading: true, error: null });

      try {
        const formattedDate = format(date, 'yyyy-MM-dd');

        // Check if score exists for this date
        const { data: existingScore } = await supabase
          .from('daily_scores')
          .select('id, budget_cycle_id')
          .eq('family_member_id', familyMemberId)
          .eq('date', formattedDate)
          .single();

        if (existingScore) {
          // Update existing score
          const { error } = await supabase
            .from('daily_scores')
            .update({
              score,
              is_vacation: isVacation,
              notes: notes || '',
            })
            .eq('id', existingScore.id);

          if (error) {
            throw error;
          }
        } else {
          // Get family member's family ID
          const { data: memberData, error: memberError } = await supabase
            .from('family_members')
            .select('family_id')
            .eq('id', familyMemberId)
            .single();

          if (memberError || !memberData) {
            throw new Error('Could not find family member');
          }

          // Get budget cycle
          const { data: cycleData, error: cycleError } = await supabase
            .from('budget_cycles')
            .select('*')
            .eq('family_id', memberData.family_id)
            .lte('start_date', formattedDate)
            .gte('end_date', formattedDate)
            .single();

          if (cycleError || !cycleData?.id) {
            throw new Error('Could not find budget cycle for this date');
          }

          // Insert new score with budget cycle
          const { error } = await supabase.from('daily_scores').insert([
            {
              family_member_id: familyMemberId,
              budget_cycle_id: cycleData.id,
              date: formattedDate,
              score,
              is_vacation: isVacation,
              notes: notes || '',
            },
          ]);

          if (error) {
            throw error;
          }
        }

        // Refresh scores
        await get().fetchScores(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save score';
        set({ error: message });
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        set({ loading: false });
      }
    },

    setVacationDays: async (startDate: Date, endDate: Date, isVacation: boolean) => {
      const { familyMemberId } = get();
      if (!familyMemberId) {
        return;
      }

      set({ loading: true, error: null });

      try {
        const startFormatted = format(startDate, 'yyyy-MM-dd');
        const endFormatted = format(endDate, 'yyyy-MM-dd');

        // Get existing scores in the date range
        const { data: existingScores } = await supabase
          .from('daily_scores')
          .select('id, date')
          .eq('family_member_id', familyMemberId)
          .gte('date', startFormatted)
          .lte('date', endFormatted);

        const existingDates = new Set(existingScores?.map(score => score.date));

        // Update existing scores
        if (existingScores?.length) {
          const { error } = await supabase
            .from('daily_scores')
            .update({ is_vacation: isVacation })
            .in(
              'id',
              existingScores.map(score => score.id)
            );

          if (error) {
            throw error;
          }
        }

        // Get family member's family ID for budget cycle lookup
        const { data: memberData, error: memberError } = await supabase
          .from('family_members')
          .select('family_id')
          .eq('id', familyMemberId)
          .single();

        if (memberError || !memberData) {
          throw new Error('Could not find family member');
        }

        // Insert new scores for dates that don't have them
        const newScores = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          if (!existingDates.has(dateStr)) {
            // Get budget cycle for this date
            const { data: cycleData } = await supabase
              .from('budget_cycles')
              .select('id')
              .eq('family_id', memberData.family_id)
              .lte('start_date', dateStr)
              .gte('end_date', dateStr)
              .single();

            if (cycleData?.id) {
              newScores.push({
                family_member_id: familyMemberId,
                budget_cycle_id: cycleData.id,
                date: dateStr,
                score: 0,
                is_vacation: isVacation,
                notes: '',
              });
            }
          }
          // Move to next day
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (newScores.length > 0) {
          const { error } = await supabase.from('daily_scores').insert(newScores);
          if (error) {
            throw error;
          }
        }

        // Refresh scores
        await get().fetchScores(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to set vacation days';
        set({ error: message });
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        set({ loading: false });
      }
    },

    // Utility
    getScoreForDay: (day: Date) => {
      const { scores } = get();
      return scores.find(score => score.date === format(day, 'yyyy-MM-dd'));
    },
  };
});
