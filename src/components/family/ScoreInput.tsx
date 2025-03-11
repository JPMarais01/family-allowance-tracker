import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const getBudgetCycle = async (): Promise<void> => {
      if (!user) {
        return;
      }

      try {
        setLoadingBudgetCycle(true);
        setError(null);
        const family = await familyData.getFamilyByOwnerId();
        if (family) {
          const budgetCycle = await familyData.getBudgetCycleForDate(family.id, date);
          if (budgetCycle) {
            setBudgetCycleId(budgetCycle.id);
          } else {
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
      }
    };

    if (!budgetCycleId) {
      getBudgetCycle();
    }
  }, [user, date, familyData, budgetCycleId]);

  const handleSave = async (): Promise<void> => {
    if (!budgetCycleId) {
      setError('Unable to determine budget cycle. Please try again later.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const input: SaveDailyScoreInput = {
        id: existingScore?.id,
        family_member_id: familyMemberId,
        budget_cycle_id: budgetCycleId,
        score,
        date: formatDate(date),
        is_vacation: isVacation,
        notes: notes || undefined,
      };

      const result = await familyData.saveDailyScore(input);
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
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
