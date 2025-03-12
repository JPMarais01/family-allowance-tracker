import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useFamilyData } from '../../hooks/use-family-data';
import { DailyScore } from '../../lib/types';
import { ScoreDisplay } from '../family/ScoreDisplay';
import { ScoreInput } from '../family/ScoreInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface CalendarDayDetailProps {
  familyMemberId: string;
  selectedDate: Date | null;
  isOpen: boolean;
  onClose: () => void;
  onScoreChange: () => void;
}

export function CalendarDayDetail({
  familyMemberId,
  selectedDate,
  isOpen,
  onClose,
  onScoreChange,
}: CalendarDayDetailProps): React.ReactElement | null {
  const { user } = useAuth();
  const familyData = useFamilyData(user);
  const [score, setScore] = useState<DailyScore | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch the score for the selected date when the dialog opens
  useEffect(() => {
    const fetchScore = async (): Promise<void> => {
      if (!selectedDate || !familyMemberId || !isOpen) {
        return;
      }

      try {
        setLoading(true);
        const dailyScore = await familyData.getDailyScore(familyMemberId, selectedDate);
        setScore(dailyScore);
        // If no score exists, go straight to edit mode
        setIsEditing(!dailyScore);
      } catch (error) {
        console.error('Error fetching score:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScore();
  }, [selectedDate, familyMemberId, isOpen, familyData]);

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

  if (!selectedDate) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : isEditing ? (
          <ScoreInput
            familyMemberId={familyMemberId}
            date={selectedDate}
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
