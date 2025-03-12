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
import { cn } from '../../lib/utils';
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
  const [_loading, setLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<Date | null>(null);

  // Get days of the week for the header
  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 0 }),
    end: endOfWeek(new Date(), { weekStartsOn: 0 }),
  });

  // Get all days to display in the calendar
  const calendarDays = React.useMemo(() => {
    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [startDate, endDate]);

  // Fetch scores when date range or family member changes
  useEffect(() => {
    if (user) {
      fetchScores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, familyMemberId, user]);

  // Fetch scores for the visible date range
  const fetchScores = async (): Promise<void> => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      // Only fetch scores if a specific family member is selected
      if (familyMemberId) {
        const fetchedScores = await familyData.getDailyScores(familyMemberId, startDate, endDate);
        setScores(fetchedScores);
      } else {
        setScores([]);
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get score for a specific day
  const getScoreForDay = (day: Date): DailyScore | undefined => {
    return scores.find(score => isSameDay(new Date(score.date), day));
  };

  // Handle day selection
  const handleDaySelect = (day: Date): void => {
    onDateSelect(day);
    setSelectedDayForDetail(day);
    setIsDetailOpen(true);
  };

  // Handle score change
  const handleScoreChange = async (): Promise<void> => {
    await fetchScores();
  };

  // Determine the grid layout based on view type
  const gridClassName = viewType === 'month' ? 'grid-cols-7' : 'grid-cols-7';

  return (
    <div className={cn('flex-1 overflow-auto', className)}>
      <div className="h-full flex flex-col">
        {/* Calendar header with day names */}
        <div className={cn('grid', gridClassName)}>
          {weekDays.map(day => (
            <div
              key={day.toString()}
              className="py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {format(day, 'EEE')}
            </div>
          ))}
        </div>

        {/* Calendar grid with days */}
        <div
          className={cn(
            'flex-1 grid',
            gridClassName,
            'grid-rows-auto gap-px bg-gray-200 dark:bg-gray-700'
          )}
        >
          {calendarDays.map(day => {
            // For week view, only show days in the current week
            if (viewType === 'week' && !isSameMonth(day, viewDate) && getDay(day) === 0) {
              return null;
            }

            const dayScore = getScoreForDay(day);
            const isCurrentMonth = isSameMonth(day, viewDate);

            return (
              <CalendarDay
                key={day.toString()}
                date={day}
                isCurrentMonth={isCurrentMonth}
                isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
                isToday={isToday(day)}
                isVacation={dayScore?.is_vacation}
                score={dayScore?.score}
                notes={dayScore?.notes}
                onSelect={() => handleDaySelect(day)}
              />
            );
          })}
        </div>

        {/* Day detail modal */}
        {selectedDayForDetail && (
          <CalendarDayDetail
            isOpen={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
            selectedDate={selectedDayForDetail}
            familyMemberId={familyMemberId || ''}
            onScoreChange={handleScoreChange}
          />
        )}
      </div>
    </div>
  );
}
