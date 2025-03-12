import { format } from 'date-fns';
import * as React from 'react';
import { useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useFamilyData } from '../../hooks/use-family-data';
import { toast } from '../../hooks/use-toast';
import { SaveDailyScoreInput } from '../../lib/types';
import { formatDate, getDateRange } from '../../lib/utils';
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
  const { user } = useAuth();
  const familyData = useFamilyData(user);

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
    }
  };

  // Handle form submission
  const handleSubmit = async (): Promise<void> => {
    if (!familyMemberId) {
      setError('No family member selected');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Get all dates in the range
      const dateRange = getDateRange(startDate, endDate);

      // Get the budget cycle for the date range
      const family = await familyData.getFamilyByOwnerId();
      if (!family) {
        throw new Error('Family not found');
      }

      // Process each date in the range
      let successCount = 0;
      let errorCount = 0;

      for (const date of dateRange) {
        try {
          // Get the budget cycle for this date
          const budgetCycle = await familyData.getBudgetCycleForDate(family.id, date);
          if (!budgetCycle) {
            errorCount++;
            continue;
          }

          // Check if a score already exists for this date
          const existingScore = await familyData.getDailyScore(familyMemberId, date);

          // Prepare the input for saving the score
          const input: SaveDailyScoreInput = {
            id: existingScore?.id,
            family_member_id: familyMemberId,
            budget_cycle_id: budgetCycle.id,
            // Use existing score or default to 3
            score: existingScore?.score || 3,
            date: formatDate(date),
            is_vacation: setAsVacation,
            notes: existingScore?.notes || undefined,
          };

          // Save the score
          const result = await familyData.saveDailyScore(input);
          if (result) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error processing date ${formatDate(date)}:`, error);
          errorCount++;
        }
      }

      // Show success message
      if (successCount > 0) {
        toast({
          title: setAsVacation ? 'Vacation Days Set' : 'Vacation Status Removed',
          description: `Successfully ${setAsVacation ? 'set' : 'removed'} vacation status for ${successCount} day${successCount !== 1 ? 's' : ''}.`,
        });

        // Notify parent component
        onVacationDaysSet();

        // Close the modal
        onClose();
      }

      // Show error message if any
      if (errorCount > 0) {
        setError(`Failed to process ${errorCount} day${errorCount !== 1 ? 's' : ''}.`);
      }
    } catch (error) {
      console.error('Error setting vacation days:', error);
      setError('An error occurred while setting vacation days. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Calculate the number of days in the range
  const daysCount = getDateRange(startDate, endDate).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {setAsVacation ? 'Set Vacation Days' : 'Remove Vacation Status'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center space-x-2 mb-4">
            <Switch checked={setAsVacation} onCheckedChange={setSetAsVacation} id="vacation-mode" />
            <label htmlFor="vacation-mode" className="text-sm font-medium">
              {setAsVacation ? 'Set as vacation days' : 'Remove vacation status'}
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date:</label>
              <DatePicker date={startDate} onDateChange={handleStartDateChange} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date:</label>
              <DatePicker date={endDate} onDateChange={handleEndDateChange} />
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This will {setAsVacation ? 'set' : 'remove'} vacation status for {daysCount} day
            {daysCount !== 1 ? 's' : ''} from{' '}
            <span className="font-medium">{format(startDate, 'MMM d, yyyy')}</span> to{' '}
            <span className="font-medium">{format(endDate, 'MMM d, yyyy')}</span>.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={processing}>
            {processing ? (
              <>
                <span className="mr-2">Processing...</span>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              </>
            ) : setAsVacation ? (
              'Set Vacation Days'
            ) : (
              'Remove Vacation Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
