import { addMonths, endOfMonth, startOfMonth, subMonths } from 'date-fns';
import * as React from 'react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';

export type CalendarView = 'month' | 'week';

interface CalendarContainerProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

export function CalendarContainer({
  selectedDate: externalSelectedDate,
  onDateSelect,
  className,
}: CalendarContainerProps): React.ReactElement {
  // State for the current view date (month/week being viewed)
  const [viewDate, setViewDate] = useState<Date>(externalSelectedDate || new Date());

  // State for the calendar view type (month or week)
  const [viewType, setViewType] = useState<CalendarView>('month');

  // State for the selected date (if controlled externally, use that)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(externalSelectedDate);

  // Handle date selection
  const handleDateSelect = (date: Date): void => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Navigation handlers
  const goToPreviousPeriod = (): void => {
    setViewDate(prevDate => subMonths(prevDate, 1));
  };

  const goToNextPeriod = (): void => {
    setViewDate(prevDate => addMonths(prevDate, 1));
  };

  const goToToday = (): void => {
    setViewDate(new Date());
  };

  // View type change handler
  const handleViewTypeChange = (view: CalendarView): void => {
    setViewType(view);
  };

  // Calculate the visible date range based on the view type and date
  const visibleStartDate = startOfMonth(viewDate);
  const visibleEndDate = endOfMonth(viewDate);

  return (
    <div className={cn('flex flex-col w-full h-full', className)}>
      <CalendarHeader
        viewDate={viewDate}
        viewType={viewType}
        onPrevious={goToPreviousPeriod}
        onNext={goToNextPeriod}
        onToday={goToToday}
        onViewTypeChange={handleViewTypeChange}
      />

      <CalendarGrid
        viewDate={viewDate}
        viewType={viewType}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        startDate={visibleStartDate}
        endDate={visibleEndDate}
      />
    </div>
  );
}
