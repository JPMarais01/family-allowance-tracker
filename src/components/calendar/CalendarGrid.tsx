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
import { cn } from '../../lib/utils';
import { CalendarView } from './CalendarContainer';
import { CalendarDay } from './CalendarDay';

interface CalendarGridProps {
  viewDate: Date;
  viewType: CalendarView;
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  startDate: Date;
  endDate: Date;
  className?: string;
}

export function CalendarGrid({
  viewDate,
  viewType,
  selectedDate,
  onDateSelect,
  startDate,
  endDate,
  className,
}: CalendarGridProps): React.ReactElement {
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

      {/* Calendar grid */}
      <div className="flex flex-col h-full">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 flex-1 min-h-[3rem]">
            {week.map(day => {
              const isCurrentMonth = isSameMonth(day, viewDate);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isTodayDate = isToday(day);

              return (
                <CalendarDay
                  key={day.toString()}
                  date={day}
                  isCurrentMonth={isCurrentMonth}
                  isSelected={isSelected}
                  isToday={isTodayDate}
                  onSelect={() => onDateSelect(day)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
