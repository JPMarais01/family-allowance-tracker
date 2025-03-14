import { format } from 'date-fns';
import * as React from 'react';
import { useState } from 'react';
import { toast } from '../../hooks/use-toast';
import { getDateRange } from '../../lib/utils';
import { useCalendarStore } from '../../stores/CalendarStore';
import { Button } from '../ui/button';
import { DatePicker } from '../ui/date-picker';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Switch } from '../ui/switch';

interface BulkVacationModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyMemberId: string;
  onVacationDaysSet: () => void;
  defaultStartDate?: Date;
  defaultEndDate?: Date;
}

export function BulkVacationModal({
  isOpen,
  onClose,
  familyMemberId,
  onVacationDaysSet,
  defaultStartDate = new Date(),
  defaultEndDate = new Date(),
}: BulkVacationModalProps): React.ReactElement {
  const { setVacationDays, loading } = useCalendarStore();

  // State for date range
  const [startDate, setStartDate] = useState<Date>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date>(defaultEndDate);

  // State for processing status
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for vacation status (set or unset)
  const [setAsVacation, setSetAsVacation] = useState<boolean>(true);

  // Handle start date change
  const handleStartDateChange = (date: Date): void => {
    setStartDate(date);
    // If end date is before start date, update end date
    if (date > endDate) {
      setEndDate(date);
    }
  };

  // Handle end date change
  const handleEndDateChange = (date: Date): void => {
    // Ensure end date is not before start date
    if (date >= startDate) {
      setEndDate(date);
    } else {
      toast({
        title: 'Invalid Date Range',
        description: 'End date cannot be before start date',
        variant: 'destructive',
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (): Promise<void> => {
    if (!familyMemberId) {
      setError('No family member selected');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Get all dates in the range
      const dateRange = getDateRange(startDate, endDate);

      if (dateRange.length === 0) {
        throw new Error('Invalid date range');
      }

      if (dateRange.length > 60) {
        throw new Error('Date range too large (maximum 60 days)');
      }

      // Set vacation days using the calendar context
      await setVacationDays(startDate, endDate, setAsVacation);

      // Show success message
      toast({
        title: 'Success',
        description: `${setAsVacation ? 'Set' : 'Unset'} vacation for ${dateRange.length} day${
          dateRange.length === 1 ? '' : 's'
        }`,
      });

      // Call the callback
      onVacationDaysSet();

      // Close the modal
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set vacation days';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Vacation Days</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Date range selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <DatePicker date={startDate} onDateChange={handleStartDateChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <DatePicker date={endDate} onDateChange={handleEndDateChange} />
            </div>
          </div>

          {/* Vacation toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {setAsVacation ? 'Set as vacation days' : 'Remove vacation status'}
            </span>
            <Switch
              checked={setAsVacation}
              onCheckedChange={setSetAsVacation}
              disabled={processing || loading}
            />
          </div>

          {/* Date range summary */}
          <div className="text-sm text-muted-foreground">
            {startDate && endDate ? (
              <>
                <p>
                  {format(startDate, 'MMM d, yyyy')} to {format(endDate, 'MMM d, yyyy')}
                </p>
                <p className="mt-1">
                  {getDateRange(startDate, endDate).length} day
                  {getDateRange(startDate, endDate).length === 1 ? '' : 's'}
                </p>
              </>
            ) : (
              <p>Select a date range</p>
            )}
          </div>

          {/* Error message */}
          {error && <div className="text-sm text-red-500">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processing || loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={processing || loading}>
            {processing || loading ? (
              <>
                <span className="mr-2">Processing...</span>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              </>
            ) : (
              `${setAsVacation ? 'Set' : 'Remove'} Vacation Days`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
