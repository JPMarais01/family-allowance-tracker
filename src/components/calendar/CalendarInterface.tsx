import * as React from 'react';
import { CalendarContainer } from './CalendarContainer';

interface CalendarInterfaceProps {
  className?: string;
}

/**
 * CalendarInterface component that serves as the main entry point for the calendar feature
 * This component is used in the Dashboard and wraps the CalendarContainer
 * Note: We've removed the CalendarProvider since we're now using the CalendarStore
 */
export function CalendarInterface({ className }: CalendarInterfaceProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Calendar</h2>
      <p className="mb-4">
        View and manage daily scores for each family member in a calendar format. You can also mark
        vacation days.
      </p>

      <CalendarContainer className={className} />
    </div>
  );
}
