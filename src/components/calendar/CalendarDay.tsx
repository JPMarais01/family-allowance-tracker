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
  notes?: string | null;
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
  notes,
  onSelect,
  className,
}: CalendarDayProps): React.ReactElement {
  // Generate vacation style - enhanced for better visual distinction
  const vacationStyle = isVacation
    ? 'bg-purple-100 dark:bg-purple-900/30 italic border-dashed border-purple-300 dark:border-purple-700'
    : '';

  // Get the score color class from the shared utility
  const scoreColorClass = getScoreColorClass(score);

  // Tooltip content
  const tooltipContent = React.useMemo(() => {
    const parts = [];

    if (score !== undefined) {
      parts.push(`Score: ${score}`);
    }

    if (isVacation) {
      parts.push('Vacation Day');
    }

    if (notes) {
      // Truncate long notes for the tooltip
      const truncatedNotes = notes.length > 50 ? `${notes.substring(0, 47)}...` : notes;
      parts.push(`Notes: ${truncatedNotes}`);
    }

    return parts.join(' • ');
  }, [score, isVacation, notes]);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'group relative h-full min-h-[4rem] p-1 border border-gray-200 dark:border-gray-800 flex flex-col',
        'transition-all duration-200 hover:shadow-md',
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
      title={tooltipContent}
    >
      <span className="absolute top-1 right-1 text-xs">{format(date, 'd')}</span>

      {score !== undefined && (
        <div className="mt-5 flex items-center justify-center">
          <span
            className={cn(
              'text-lg font-semibold',
              isVacation && 'italic',
              'transition-transform group-hover:scale-110'
            )}
          >
            {score}
          </span>
        </div>
      )}

      {isVacation && (
        <div className="absolute bottom-1 left-1">
          <span className="text-xs text-purple-600 dark:text-purple-400">Vacation</span>
        </div>
      )}

      {/* Indicator for notes */}
      {notes && (
        <div className="absolute bottom-1 right-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">•••</span>
        </div>
      )}
    </button>
  );
}
