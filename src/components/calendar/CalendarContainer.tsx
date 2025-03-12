import * as React from 'react';
import { useEffect } from 'react';
import { useCalendar } from '../../hooks/use-calendar';
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
  const {
    viewDate,
    viewType,
    selectedDate,
    startDate,
    endDate,
    familyMemberId,
    setViewDate,
    setViewType,
    setSelectedDate,
    setFamilyMemberId,
    goToPreviousPeriod,
    goToNextPeriod,
    goToToday,
  } = useCalendar();

  // Sync external state with context state
  useEffect(() => {
    if (externalSelectedDate) {
      setSelectedDate(externalSelectedDate);
    }
  }, [externalSelectedDate, setSelectedDate]);

  useEffect(() => {
    if (externalFamilyMemberId) {
      setFamilyMemberId(externalFamilyMemberId);
    }
  }, [externalFamilyMemberId, setFamilyMemberId]);

  // Handle date selection
  const handleDateSelect = (date: Date): void => {
    setSelectedDate(date);

    // Call external handler if provided
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Handle family member change
  const handleFamilyMemberChange = (memberId: string): void => {
    setFamilyMemberId(memberId);

    // Call external handler if provided
    if (onFamilyMemberChange) {
      onFamilyMemberChange(memberId);
    }
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Calendar header with navigation and view controls */}
      <CalendarHeader
        viewDate={viewDate}
        viewType={viewType}
        onPrevious={goToPreviousPeriod}
        onNext={goToNextPeriod}
        onToday={goToToday}
        onViewTypeChange={setViewType}
        onDateChange={setViewDate}
        familyMemberId={familyMemberId || undefined}
        onFamilyMemberChange={handleFamilyMemberChange}
      />

      {/* Calendar grid with days */}
      <CalendarGrid
        viewDate={viewDate}
        viewType={viewType}
        selectedDate={selectedDate || undefined}
        onDateSelect={handleDateSelect}
        startDate={startDate}
        endDate={endDate}
        familyMemberId={familyMemberId || undefined}
      />
    </div>
  );
}
