import { format } from 'date-fns';
import * as React from 'react';
import { useState } from 'react';
import { DailyScore } from '../../lib/types';
import { CalendarContainer } from './CalendarContainer';

interface CalendarExampleProps {
  scores?: DailyScore[];
  onDateSelect?: (date: Date) => void;
  className?: string;
}

export function CalendarExample({
  scores = [],
  onDateSelect,
  className,
}: CalendarExampleProps): React.ReactElement {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleDateSelect = (date: Date): void => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Map scores to a more easily accessible format
  const scoreMap = new Map<string, DailyScore>();
  scores.forEach(score => {
    scoreMap.set(score.date, score);
  });

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white dark:bg-gray-950 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Calendar Example</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Selected date: {format(selectedDate, 'PPP')}
        </p>

        <div className="border rounded-lg overflow-hidden">
          <CalendarContainer
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            className={className}
          />
        </div>
      </div>
    </div>
  );
}
