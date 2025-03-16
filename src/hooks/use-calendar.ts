import { format } from 'date-fns';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CalendarState } from '../stores/CalendarStore';
import { useCalendarStore } from '../stores/CalendarStore';

/**
 * Custom hook that provides access to the calendar store with URL synchronization
 * This hook automatically syncs the calendar state with URL parameters
 */
export const useCalendar = (): CalendarState => {
  const calendarStore = useCalendarStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Keep track of previous values to detect changes
  const prevValuesRef = useRef({
    viewDate: calendarStore.viewDate,
    viewType: calendarStore.viewType,
    familyMemberId: calendarStore.familyMemberId,
  });

  // Sync from URL to store on mount and when URL changes
  useEffect(() => {
    if (calendarStore.urlSyncEnabled) {
      calendarStore.syncWithUrl(searchParams);
    }
  }, [searchParams, calendarStore, calendarStore.urlSyncEnabled]);

  // Sync from store to URL when store changes
  useEffect(() => {
    if (calendarStore.urlSyncEnabled) {
      const updateUrl = (): void => {
        const newParams = calendarStore.getUrlParams();

        // Only update if params have changed to avoid unnecessary history entries
        let hasChanges = false;
        for (const [key, value] of newParams.entries()) {
          if (searchParams.get(key) !== value) {
            hasChanges = true;
            break;
          }
        }

        // Check for params that should be removed
        for (const key of Array.from(searchParams.keys())) {
          if (!newParams.has(key)) {
            hasChanges = true;
            break;
          }
        }

        if (hasChanges) {
          setSearchParams(newParams);
        }
      };

      // Check if relevant state has changed
      const currentValues = {
        viewDate: calendarStore.viewDate,
        viewType: calendarStore.viewType,
        familyMemberId: calendarStore.familyMemberId,
      };

      const hasChanged =
        format(currentValues.viewDate, 'yyyy-MM-dd') !==
          format(prevValuesRef.current.viewDate, 'yyyy-MM-dd') ||
        currentValues.viewType !== prevValuesRef.current.viewType ||
        currentValues.familyMemberId !== prevValuesRef.current.familyMemberId;

      if (hasChanged) {
        updateUrl();
        prevValuesRef.current = currentValues;
      }
    }
  }, [
    calendarStore,
    calendarStore.viewDate,
    calendarStore.viewType,
    calendarStore.familyMemberId,
    calendarStore.urlSyncEnabled,
    searchParams,
    setSearchParams,
  ]);

  return calendarStore;
};
