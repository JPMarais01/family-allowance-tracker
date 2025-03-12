import { format } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { cn } from '../../lib/utils';
import { CalendarView } from './CalendarContainer';

interface CalendarHeaderProps {
  viewDate: Date;
  viewType: CalendarView;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewTypeChange: (view: CalendarView) => void;
  className?: string;
}

export function CalendarHeader({
  viewDate,
  viewType,
  onPrevious,
  onNext,
  onToday,
  onViewTypeChange,
  className,
}: CalendarHeaderProps): React.ReactElement {
  return (
    <div className={cn('flex items-center justify-between p-2 border-b', className)}>
      <div className="flex items-center space-x-2">
        <button
          onClick={onPrevious}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={onToday}
          className="px-3 py-1 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Today
        </button>

        <button
          onClick={onNext}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <h2 className="text-lg font-semibold flex items-center">
        <Calendar className="h-5 w-5 mr-2" />
        {format(viewDate, 'MMMM yyyy')}
      </h2>

      <div className="flex items-center space-x-1 rounded-md bg-gray-100 dark:bg-gray-800 p-1">
        <button
          onClick={() => onViewTypeChange('month')}
          className={cn(
            'px-3 py-1 text-sm rounded-md',
            viewType === 'month'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          Month
        </button>

        <button
          onClick={() => onViewTypeChange('week')}
          className={cn(
            'px-3 py-1 text-sm rounded-md',
            viewType === 'week'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          Week
        </button>
      </div>
    </div>
  );
}
