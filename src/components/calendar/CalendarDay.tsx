import { format } from 'date-fns';
import * as React from 'react';
import { getScoreColorClass } from '../../lib/score-utils';
import { cn } from '../../lib/utils';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isVacation?: boolean;
  score?: number;
  onSelect: () => void;
  className?: string;
}

export function CalendarDay({
  date,
  isCurrentMonth,
  isSelected,
  isToday,
  isVacation = false,
  score,
  onSelect,
  className,
}: CalendarDayProps): React.ReactElement {
  // Generate vacation style
  const vacationStyle = isVacation ? 'bg-purple-100 dark:bg-purple-900/30 italic' : '';

  // Get the score color class from the shared utility
  const scoreColorClass = getScoreColorClass(score);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative h-full min-h-[4rem] p-1 border border-gray-200 dark:border-gray-800 flex flex-col',
        isCurrentMonth
          ? 'bg-white dark:bg-gray-950'
          : 'bg-gray-50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-600',
        isSelected && 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-950',
        isToday && 'font-bold',
        scoreColorClass,
        vacationStyle,
        className
      )}
      aria-label={format(date, 'PPPP')}
    >
      <span className="absolute top-1 right-1 text-xs">{format(date, 'd')}</span>

      {score !== undefined && (
        <div className="mt-5 flex items-center justify-center">
          <span className={cn('text-lg font-semibold', isVacation && 'italic')}>{score}</span>
        </div>
      )}

      {isVacation && (
        <div className="absolute bottom-1 left-1">
          <span className="text-xs text-purple-600 dark:text-purple-400">Vacation</span>
        </div>
      )}
    </button>
  );
}
