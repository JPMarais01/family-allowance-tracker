import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const [score, setScore] = useState<number>(existingScore?.score || 3);
  const [isVacation, setIsVacation] = useState<boolean>(existingScore?.is_vacation || false);
  const [notes, setNotes] = useState<string>(existingScore?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgetCycleId, setBudgetCycleId] = useState<string | null>(
    existingScore?.budget_cycle_id || null
  );
  const [loadingBudgetCycle, setLoadingBudgetCycle] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isFetchingCycleRef = useRef(false);

  // Extract needed functions to avoid dependency issues
  const { getFamilyByOwnerId, getBudgetCycleForDate, saveDailyScore, deleteDailyScore } =
    familyData;

  useEffect(() => {
    const getBudgetCycle = async (): Promise<void> => {
      if (!user || isFetchingCycleRef.current) {
        return;
      }

      try {
        isFetchingCycleRef.current = true;
        setLoadingBudgetCycle(true);
        setError(null);
        const family = await getFamilyByOwnerId();
        if (family) {
          // Small delay to prevent UI flashing
          await new Promise(resolve => setTimeout(resolve, 500));

          const budgetCycle = await getBudgetCycleForDate(family.id, date);
          if (budgetCycle) {
            setBudgetCycleId(budgetCycle.id);
          } else {
            console.error('Failed to get or create budget cycle');
            setError('Unable to determine budget cycle. Please try again later.');
          }
        } else {
          setError('Unable to find family information. Please try again later.');
        }
      } catch (error) {
        console.error('Error getting budget cycle:', error);
        setError(
          'An error occurred while getting budget cycle information. Please try again later.'
        );
      } finally {
        setLoadingBudgetCycle(false);
        isFetchingCycleRef.current = false;
      }
    };

    if (!budgetCycleId) {
      getBudgetCycle();
    }
  }, [user, date, getFamilyByOwnerId, getBudgetCycleForDate, budgetCycleId]);

  const handleSave = async (): Promise<void> => {
    if (!budgetCycleId) {
      // Try to get the budget cycle one more time before giving up
      try {
        setError(null);
        setSaving(true);
        const family = await getFamilyByOwnerId();
        if (family) {
          const budgetCycle = await getBudgetCycleForDate(family.id, date);
          if (budgetCycle) {
            setBudgetCycleId(budgetCycle.id);
            // Continue with save after setting the budget cycle ID
            await saveScore(budgetCycle.id);
            return;
          } else {
            console.error('Failed to get or create budget cycle on retry');
          }
        } else {
          console.error('Failed to get family on retry');
        }
      } catch (error) {
        console.error('Error getting budget cycle before save:', error);
      } finally {
        setSaving(false);
      }

      setError(
        'Unable to determine budget cycle. Please try refreshing the page and trying again.'
      );
      return;
    }

    await saveScore(budgetCycleId);
  };

  const saveScore = async (cycleId: string): Promise<void> => {
    try {
      setSaving(true);
      setError(null);

      const input: SaveDailyScoreInput = {
        id: existingScore?.id,
        family_member_id: familyMemberId,
        budget_cycle_id: cycleId,
        score,
        date: formatDate(date),
        is_vacation: isVacation,
        notes: notes || undefined,
      };

      const result = await saveDailyScore(input);
      if (result) {
        toast({
          title: existingScore ? 'Score Updated' : 'Score Added',
          description: `Successfully ${existingScore ? 'updated' : 'added'} score for ${formatDate(date)}.`,
        });
        onSaved();
      } else {
        setError('Failed to save score. Please try again.');
      }
    } catch (error) {
      console.error('Error saving score:', error);
      setError('An error occurred while saving the score. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(() => {
    if (existingScore) {
      setShowDeleteConfirm(true);
    }
  }, [existingScore]);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!existingScore) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setShowDeleteConfirm(false);

      const success = await deleteDailyScore(existingScore.id);
      if (success) {
        toast({
          title: 'Score Deleted',
          description: `Successfully deleted score for ${formatDate(date)}.`,
        });
        onSaved();
      } else {
        setError('Failed to delete score. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting score:', error);
      setError('An error occurred while deleting the score. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [existingScore, date, deleteDailyScore, onSaved]);

  if (loadingBudgetCycle) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Loading budget cycle information...</p>
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
        <Button onClick={handleSave} disabled={saving || !!error || !budgetCycleId}>
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
