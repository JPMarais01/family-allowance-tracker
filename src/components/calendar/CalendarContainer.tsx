import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';

export type CalendarView = 'month' | 'week';

interface CalendarContainerProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  familyMemberId?: string;
  onFamilyMemberChange?: (memberId: string) => void;
  className?: string;
}

export function CalendarContainer({
  selectedDate: externalSelectedDate,
  onDateSelect,
  familyMemberId: externalFamilyMemberId,
  onFamilyMemberChange,
  className,
}: CalendarContainerProps): React.ReactElement {
  // Use URL search params for state persistence
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL parameters or defaults
  const initialViewType = (searchParams.get('view') as CalendarView) || 'month';
  const initialViewDate = searchParams.get('date')
    ? new Date(searchParams.get('date') as string)
    : externalSelectedDate || new Date();
  const initialFamilyMemberId = searchParams.get('memberId') || externalFamilyMemberId || '';

  // State for the current view date (month/week being viewed)
  const [viewDate, setViewDate] = useState<Date>(initialViewDate);

  // State for the calendar view type (month or week)
  const [viewType, setViewType] = useState<CalendarView>(initialViewType);

  // State for the selected date (if controlled externally, use that)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(externalSelectedDate);

  // State for the selected family member
  const [familyMemberId, setFamilyMemberId] = useState<string>(initialFamilyMemberId);

  // Update URL parameters when state changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('view', viewType);
    params.set('date', viewDate.toISOString().split('T')[0]);

    if (familyMemberId) {
      params.set('memberId', familyMemberId);
    } else {
      params.delete('memberId');
    }

    setSearchParams(params, { replace: true });
  }, [viewDate, viewType, familyMemberId, searchParams, setSearchParams]);

  // Handle date selection
  const handleDateSelect = (date: Date): void => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Handle family member selection
  const handleFamilyMemberChange = useCallback(
    (memberId: string): void => {
      setFamilyMemberId(memberId);
      if (onFamilyMemberChange) {
        onFamilyMemberChange(memberId);
      }
    },
    [onFamilyMemberChange]
  );

  // Navigation handlers
  const goToPreviousPeriod = (): void => {
    if (viewType === 'month') {
      setViewDate(prevDate => subMonths(prevDate, 1));
    } else {
      setViewDate(prevDate => subWeeks(prevDate, 1));
    }
  };

  const goToNextPeriod = (): void => {
    if (viewType === 'month') {
      setViewDate(prevDate => addMonths(prevDate, 1));
    } else {
      setViewDate(prevDate => addWeeks(prevDate, 1));
    }
  };

  const goToToday = (): void => {
    setViewDate(new Date());
  };

  // Direct date change handler
  const handleDateChange = (date: Date): void => {
    setViewDate(date);
  };

  // View type change handler
  const handleViewTypeChange = (view: CalendarView): void => {
    setViewType(view);
  };

  // Calculate the visible date range based on the view type and date
  const visibleStartDate =
    viewType === 'month' ? startOfMonth(viewDate) : startOfWeek(viewDate, { weekStartsOn: 0 });

  const visibleEndDate =
    viewType === 'month' ? endOfMonth(viewDate) : endOfWeek(viewDate, { weekStartsOn: 0 });

  return (
    <div className={cn('flex flex-col w-full h-full', className)}>
      <CalendarHeader
        viewDate={viewDate}
        viewType={viewType}
        onPrevious={goToPreviousPeriod}
        onNext={goToNextPeriod}
        onToday={goToToday}
        onViewTypeChange={handleViewTypeChange}
        onDateChange={handleDateChange}
        familyMemberId={familyMemberId}
        onFamilyMemberChange={handleFamilyMemberChange}
      />

      <CalendarGrid
        viewDate={viewDate}
        viewType={viewType}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        startDate={visibleStartDate}
        endDate={visibleEndDate}
        familyMemberId={familyMemberId}
      />
    </div>
  );
}
