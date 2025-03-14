import { format } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';
import { DailyScore } from '../../lib/types';
import { useCalendarStore } from '../../stores/CalendarStore';
import { ScoreDisplay } from '../family/ScoreDisplay';
import { ScoreInput } from '../family/ScoreInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface CalendarDayDetailProps {
  date: Date;
  familyMemberId?: string;
  isOpen: boolean;
  onClose: () => void;
  onScoreChange: () => void;
  existingScore?: DailyScore;
}

export function CalendarDayDetail({
  date,
  familyMemberId,
  isOpen,
  onClose,
  onScoreChange,
  existingScore,
}: CalendarDayDetailProps): React.ReactElement | null {
  // Hooks
  const { loading: calendarLoading } = useCalendarStore();

  // State
  const [score, setScore] = useState<DailyScore | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Initialize with existing score if provided
      if (existingScore) {
        setScore(existingScore);
        setIsEditing(false);
      } else {
        setScore(null);
        setIsEditing(true); // Go straight to edit mode for new scores
      }
      setError(null);
    }
  }, [isOpen, existingScore]);

  // Handle score saved
  const handleScoreSaved = useCallback(() => {
    // Refresh data first
    onScoreChange();

    // Then close dialog
    onClose();
  }, [onScoreChange, onClose]);

  // Handle edit request
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Handle cancel
  const handleCancel = useCallback(() => {
    // If there was no score and we cancel, close the dialog
    if (!score) {
      onClose();
    } else {
      setIsEditing(false);
    }
  }, [score, onClose]);

  // If no date, don't render
  if (!date) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{format(date, 'EEEE, MMMM d, yyyy')}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md mb-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {calendarLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : isEditing ? (
          <ScoreInput
            familyMemberId={familyMemberId || ''}
            date={date}
            existingScore={score}
            onSaved={handleScoreSaved}
            onCancel={handleCancel}
          />
        ) : (
          <ScoreDisplay score={score} onEdit={handleEdit} />
        )}
      </DialogContent>
    </Dialog>
  );
}
