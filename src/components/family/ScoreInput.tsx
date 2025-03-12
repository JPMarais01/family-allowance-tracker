import React, { useCallback, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useFamilyData } from '../../hooks/use-family-data';
import { toast } from '../../hooks/use-toast';
import { DailyScore, SaveDailyScoreInput } from '../../lib/types';
import { formatDate } from '../../lib/utils';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';

interface ScoreInputProps {
  familyMemberId: string;
  date: Date;
  existingScore: DailyScore | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function ScoreInput({
  familyMemberId,
  date,
  existingScore,
  onSaved,
  onCancel,
}: ScoreInputProps): React.ReactElement {
  const { user } = useAuth();
  const familyData = useFamilyData(user);

  // Form state
  const [score, setScore] = useState<number>(existingScore?.score || 3);
  const [isVacation, setIsVacation] = useState<boolean>(existingScore?.is_vacation || false);
  const [notes, setNotes] = useState<string>(existingScore?.notes || '');

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Handle save
  const handleSave = useCallback(async (): Promise<void> => {
    if (!user || !familyMemberId || !date) {
      setError('Missing required data for save');
      return;
    }

    // Set loading state
    setSaving(true);
    setError(null);

    try {
      // Step 1: Get the family
      const family = await familyData.getFamilyByOwnerId();
      if (!family) {
        setError('Unable to find family information');
        setSaving(false);
        return;
      }

      // Step 2: Get or create the budget cycle
      const budgetCycle = await familyData.getBudgetCycleForDate(family.id, date);
      if (!budgetCycle) {
        setError('Unable to determine budget cycle');
        setSaving(false);
        return;
      }

      // Step 3: Save the score
      const input: SaveDailyScoreInput = {
        id: existingScore?.id,
        family_member_id: familyMemberId,
        budget_cycle_id: budgetCycle.id,
        score,
        date: formatDate(date),
        is_vacation: isVacation,
        notes: notes || undefined,
      };

      const result = await familyData.saveDailyScore(input);

      // Handle the result - force state update before calling onSaved
      if (result) {
        // Show toast
        toast({
          title: existingScore ? 'Score Updated' : 'Score Added',
          description: `Successfully ${existingScore ? 'updated' : 'added'} score for ${formatDate(date)}.`,
        });
        
        // Deliberately reset the loading state before calling onSaved
        setSaving(false);
        
        // Let the parent know we're done and it should refresh data
        setTimeout(() => {
          onSaved();
        }, 0);
      } else {
        setError('Failed to save score. Please try again.');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error saving score:', error);
      setError('An error occurred while saving the score. Please try again.');
      setSaving(false);
    }
  }, [user, familyMemberId, date, score, isVacation, notes, existingScore, familyData, onSaved]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (existingScore) {
      setShowDeleteConfirm(true);
    }
  }, [existingScore]);

  // Handle delete confirmation
  const handleDeleteConfirmed = useCallback(async () => {
    if (!existingScore) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setShowDeleteConfirm(false);

      const success = await familyData.deleteDailyScore(existingScore.id);

      if (success) {
        // Show toast notification
        toast({
          title: 'Score Deleted',
          description: `Successfully deleted score for ${formatDate(date)}.`,
        });
        
        // Reset saving state before calling onSaved
        setSaving(false);
        
        // Notify parent
        setTimeout(() => {
          onSaved();
        }, 0);
      } else {
        setError('Failed to delete score. Please try again.');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error deleting score:', error);
      setError('An error occurred while deleting the score. Please try again.');
      setSaving(false);
    }
  }, [existingScore, date, familyData, onSaved]);

  // If we're in a loading state, show a spinner
  if (saving) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>{existingScore ? 'Updating' : 'Creating'} score...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Score (1-5):</label>
        <div className="flex space-x-4">
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setScore(value)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                score === value ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch checked={isVacation} onCheckedChange={setIsVacation} id="vacation-mode" />
        <label htmlFor="vacation-mode">Vacation day</label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Notes:</label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add any notes about today's score..."
          rows={3}
        />
      </div>

      <div className="flex space-x-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Score'}
        </Button>
        {existingScore && (
          <Button variant="destructive" onClick={handleDelete} disabled={saving}>
            Delete
          </Button>
        )}
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-6 text-muted-foreground">
              Are you sure you want to delete this score? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirmed}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}