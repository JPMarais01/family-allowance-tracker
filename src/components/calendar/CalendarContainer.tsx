import * as React from 'react';
import { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useCalendarStore } from '../../stores/CalendarStore';
import { CalendarGrid } from './CalendarGrid';
import { CalendarHeader } from './CalendarHeader';

export type { CalendarView } from '../../stores/CalendarStore';

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
  } = useCalendarStore();

  // Sync external state with context state
  useEffect(() => {
    if (externalSelectedDate) {
      setSelectedDate(externalSelectedDate);
    }
  }, [externalSelectedDate, setSelectedDate]);

  useEffect(() => {
    if (externalFamilyMemberId !== undefined && externalFamilyMemberId !== familyMemberId) {
      setFamilyMemberId(externalFamilyMemberId);
    }
  }, [externalFamilyMemberId, familyMemberId, setFamilyMemberId]);

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
    // Only update if the value has changed
    if (memberId !== familyMemberId) {
      setFamilyMemberId(memberId);

      // Call external handler if provided
      if (onFamilyMemberChange) {
        onFamilyMemberChange(memberId);
      }
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
