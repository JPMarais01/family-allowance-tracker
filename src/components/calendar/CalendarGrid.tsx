import {
  eachDayOfInterval,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isToday,
  startOfWeek,
} from 'date-fns';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useFamilyData } from '../../hooks/use-family-data';
import { DailyScore } from '../../lib/types';
import { cn, formatDate } from '../../lib/utils';
import { CalendarView } from './CalendarContainer';
import { CalendarDay } from './CalendarDay';
import { CalendarDayDetail } from './CalendarDayDetail';

interface CalendarGridProps {
  viewDate: Date;
  viewType: CalendarView;
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  startDate: Date;
  endDate: Date;
  familyMemberId?: string;
  className?: string;
}

export function CalendarGrid({
  viewDate,
  viewType,
  selectedDate,
  onDateSelect,
  startDate,
  endDate,
  familyMemberId,
  className,
}: CalendarGridProps): React.ReactElement {
  const { user } = useAuth();
  const familyData = useFamilyData(user);
  const [scores, setScores] = useState<DailyScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<Date | null>(null);

  // Get days of the week for the header
  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 0 }),
    end: endOfWeek(new Date(), { weekStartsOn: 0 }),
  });

  // Generate calendar days based on view type
  const calendarDays = React.useMemo(() => {
    // For month view, we need to include days from previous/next months to fill the grid
    if (viewType === 'month') {
      const monthStart = startDate;
      const monthEnd = endDate;
      const startWeek = startOfWeek(monthStart, { weekStartsOn: 0 });
      const endWeek = endOfWeek(monthEnd, { weekStartsOn: 0 });

      return eachDayOfInterval({ start: startWeek, end: endWeek });
    }

    // For week view, just show the current week
    if (viewType === 'week') {
      const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(viewDate, { weekStartsOn: 0 });

      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }

    return [];
  }, [viewDate, viewType, startDate, endDate]);

  // Fetch scores for the visible date range
  useEffect(() => {
    const fetchScores = async (): Promise<void> => {
      if (!familyMemberId || !user) {
        return;
      }

      try {
        setLoading(true);
        // Get the first and last day in the calendar view
        const firstDay = calendarDays[0];
        const lastDay = calendarDays[calendarDays.length - 1];

        const dailyScores = await familyData.getDailyScores(familyMemberId, firstDay, lastDay);
        setScores(dailyScores);
      } catch (error) {
        console.error('Error fetching scores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [calendarDays, familyMemberId, user, familyData]);

  // Group days into weeks for the grid
  const weeks = React.useMemo(() => {
    if (viewType === 'week') {
      return [calendarDays];
    }

    const result = [];
    let week = [];

    for (let i = 0; i < calendarDays.length; i++) {
      week.push(calendarDays[i]);

      if (getDay(calendarDays[i]) === 6 || i === calendarDays.length - 1) {
        result.push(week);
        week = [];
      }
    }

    return result;
  }, [calendarDays, viewType]);

  // Find score for a specific day
  const getScoreForDay = (day: Date): DailyScore | undefined => {
    return scores.find(score => score.date === formatDate(day));
  };

  // Handle day selection with detail view
  const handleDaySelect = (day: Date): void => {
    onDateSelect(day);
    if (familyMemberId) {
      setSelectedDayForDetail(day);
      setIsDetailOpen(true);
    }
  };

  // Handle score change (refresh scores)
  const handleScoreChange = async (): Promise<void> => {
    if (!familyMemberId || !user) {
      return;
    }

    try {
      // Get the first and last day in the calendar view
      const firstDay = calendarDays[0];
      const lastDay = calendarDays[calendarDays.length - 1];

      const dailyScores = await familyData.getDailyScores(familyMemberId, firstDay, lastDay);
      setScores(dailyScores);
    } catch (error) {
      console.error('Error refreshing scores:', error);
    }
  };

  return (
    <div className={cn('flex-1 overflow-auto', className)}>
      {/* Calendar header with weekday names */}
      <div className="grid grid-cols-7 text-center text-xs uppercase tracking-wide text-gray-500 border-b">
        {weekDays.map(day => (
          <div key={day.toString()} className="py-2">
            {format(day, 'EEEEEE')}
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="flex flex-col h-full relative">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 flex-1 min-h-[3rem]">
            {week.map(day => {
              const isCurrentMonth = isSameMonth(day, viewDate);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isTodayDate = isToday(day);
              const dayScore = getScoreForDay(day);

              return (
                <CalendarDay
                  key={day.toString()}
                  date={day}
                  isCurrentMonth={isCurrentMonth}
                  isSelected={isSelected}
                  isToday={isTodayDate}
                  isVacation={dayScore?.is_vacation}
                  score={dayScore?.score}
                  notes={dayScore?.notes}
                  onSelect={() => handleDaySelect(day)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Day detail dialog */}
      {familyMemberId && (
        <CalendarDayDetail
          familyMemberId={familyMemberId}
          selectedDate={selectedDayForDetail}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onScoreChange={handleScoreChange}
        />
      )}
    </div>
  );
}
