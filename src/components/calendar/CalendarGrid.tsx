import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfWeek,
} from 'date-fns';
import { Umbrella } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { useCalendar } from '../../hooks/use-calendar';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { BulkVacationModal } from './BulkVacationModal';
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
  const { loading, fetchScores, getScoreForDay } = useCalendar();

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDayForDetail, setSelectedDayForDetail] = useState<Date | null>(null);
  const [isBulkVacationModalOpen, setIsBulkVacationModalOpen] = useState(false);

  // Generate days for the calendar grid
  const calendarDays = React.useMemo(() => {
    // For month view, we need to include days from previous/next months to fill the grid
    if (viewType === 'month') {
      // Get the first day of the grid (might be from previous month)
      const start = startOfWeek(startDate, { weekStartsOn: 0 });
      // Get the last day of the grid (might be from next month)
      const end = endOfWeek(endDate, { weekStartsOn: 0 });
      // Generate all days in the interval
      return eachDayOfInterval({ start, end });
    }
    // For week view, just return the days in the week
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate, viewType]);

  // Handle day selection
  const handleDaySelect = (day: Date): void => {
    onDateSelect(day);
    setSelectedDayForDetail(day);
    setIsDetailOpen(true);
  };

  // Handle score change (refresh data)
  const handleScoreChange = async (): Promise<void> => {
    await fetchScores();
  };

  // Handle opening the bulk vacation modal
  const handleOpenBulkVacationModal = (): void => {
    setIsBulkVacationModalOpen(true);
  };

  // Handle bulk vacation days set
  const handleBulkVacationDaysSet = async (): Promise<void> => {
    await fetchScores();
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Vacation button */}
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleOpenBulkVacationModal}
          disabled={!familyMemberId}
        >
          <Umbrella className="h-4 w-4" />
          <span>Manage Vacation Days</span>
        </Button>
      </div>

      {/* Calendar grid */}
      <div
        className={cn(
          'grid gap-1',
          viewType === 'month' ? 'grid-cols-7' : 'grid-cols-7',
          'auto-rows-fr'
        )}
      >
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-medium text-muted-foreground p-2 text-sm">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map(day => {
          const dayScore = getScoreForDay(day);
          return (
            <CalendarDay
              key={format(day, 'yyyy-MM-dd')}
              date={day}
              isCurrentMonth={isSameMonth(day, viewDate)}
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

      {/* Loading indicator */}
      {loading && (
        <div className="mt-4 text-center text-sm text-muted-foreground">Loading scores...</div>
      )}

      {/* Day detail modal */}
      {selectedDayForDetail && (
        <CalendarDayDetail
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          date={selectedDayForDetail}
          familyMemberId={familyMemberId}
          onScoreChange={handleScoreChange}
          existingScore={selectedDayForDetail ? getScoreForDay(selectedDayForDetail) : undefined}
        />
      )}

      {/* Bulk vacation modal */}
      {familyMemberId && (
        <BulkVacationModal
          isOpen={isBulkVacationModalOpen}
          onClose={() => setIsBulkVacationModalOpen(false)}
          familyMemberId={familyMemberId}
          onVacationDaysSet={handleBulkVacationDaysSet}
          defaultStartDate={startDate}
          defaultEndDate={endDate}
        />
      )}
    </div>
  );
}
