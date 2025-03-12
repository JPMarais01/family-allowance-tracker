import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useCalendar } from '../../hooks/use-calendar';
import { useCalendarData } from '../../hooks/use-calendar-data';
import { DailyScore } from '../../lib/types';
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
  const { loading } = useCalendar();
  const { user } = useAuth();
  const { fetchScoreForDate } = useCalendarData(user);
  const [score, setScore] = useState<DailyScore | null>(existingScore || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the score for the selected date when the dialog opens
  useEffect(() => {
    const fetchScore = async (): Promise<void> => {
      if (!date || !familyMemberId || !isOpen) {
        return;
      }

      // If we already have the score from props, use it
      if (existingScore) {
        setScore(existingScore);
        setIsEditing(!existingScore);
        return;
      }

      try {
        setIsLoading(true);
        const dailyScore = await fetchScoreForDate(familyMemberId, date);
        setScore(dailyScore);
        // If no score exists, go straight to edit mode
        setIsEditing(!dailyScore);
      } catch (error) {
        console.error('Error fetching score:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScore();
  }, [date, familyMemberId, isOpen, existingScore, fetchScoreForDate]);

  // Handle when score is saved
  const handleScoreSaved = (): void => {
    setIsEditing(false);
    onScoreChange();
  };

  // Handle when edit is requested
  const handleEdit = (): void => {
    setIsEditing(true);
  };

  // Handle when edit is cancelled
  const handleCancel = (): void => {
    // If there was no score and we cancel, close the dialog
    if (!score) {
      onClose();
    } else {
      setIsEditing(false);
    }
  };

  if (!date) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{format(date, 'EEEE, MMMM d, yyyy')}</DialogTitle>
        </DialogHeader>

        {isLoading || loading ? (
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
