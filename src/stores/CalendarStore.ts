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

interface CalendarState {
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
          .select('id')
          .eq('family_member_id', familyMemberId)
          .eq('date', formattedDate)
          .single();

        if (existingScore) {
          // Update existing score
          const { error } = await supabase
            .from('daily_scores')
            .update({ score, is_vacation: isVacation, notes })
            .eq('id', existingScore.id);

          if (error) {
            throw error;
          }
        } else {
          // Insert new score
          const { error } = await supabase.from('daily_scores').insert([
            {
              family_member_id: familyMemberId,
              date: formattedDate,
              score,
              is_vacation: isVacation,
              notes,
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

        // Insert new scores for dates that don't have them
        const newScores = [];
        let currentDate = startDate;
        while (currentDate <= endDate) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          if (!existingDates.has(dateStr)) {
            newScores.push({
              family_member_id: familyMemberId,
              date: dateStr,
              score: 0,
              is_vacation: isVacation,
            });
          }
          currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
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
