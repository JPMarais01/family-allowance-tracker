import { useContext } from 'react';
import { CalendarContext, CalendarContextType } from '../contexts/calendar-context';

/**
 * Hook to access the calendar context
 * This is a simple wrapper around the useContext function
 * to make it easier to import and use the calendar context
 */
export function useCalendar(): CalendarContextType {
  const context = useContext(CalendarContext);

  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }

  return context;
}
