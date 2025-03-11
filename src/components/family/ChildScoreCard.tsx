import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useFamilyData } from '../../hooks/use-family-data';
import { DailyScore, FamilyMember } from '../../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScoreDisplay } from './ScoreDisplay';
import { ScoreInput } from './ScoreInput';

interface ChildScoreCardProps {
  member: FamilyMember;
  date: Date;
}

export function ChildScoreCard({ member, date }: ChildScoreCardProps): React.ReactElement {
  const { user } = useAuth();
  const familyData = useFamilyData(user);
  const [score, setScore] = useState<DailyScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const loadScore = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const existingScore = await familyData.getDailyScore(member.id, date);
      setScore(existingScore);
    } catch (error) {
      console.error('Error loading score:', error);
      setError('Failed to load score data. Please try again later.');
    } finally {
      setLoading(false);
    }
    // Remove familyData from the dependency array to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, member.id, date]);

  // Load score when component mounts or when date/member changes
  useEffect(() => {
    loadScore();
  }, [loadScore]);

  const handleScoreSaved = useCallback(() => {
    setEditing(false);
    // Reload the score to get the latest data
    loadScore();
  }, [loadScore]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{member.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md mb-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            <button
              onClick={loadScore}
              className="text-red-600 dark:text-red-400 text-sm font-medium mt-2 hover:underline"
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : editing ? (
          <ScoreInput
            familyMemberId={member.id}
            date={date}
            existingScore={score}
            onSaved={handleScoreSaved}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <ScoreDisplay score={score} onEdit={() => setEditing(true)} />
        )}
      </CardContent>
    </Card>
  );
}
