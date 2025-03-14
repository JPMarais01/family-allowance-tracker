import React, { useMemo } from 'react';
import { getScoreColorClass } from '../../lib/score-utils';
import { DailyScore } from '../../lib/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ScoreDisplayProps {
  score: DailyScore | null;
  onEdit: () => void;
}

// Using React.memo to prevent unnecessary re-renders
export const ScoreDisplay = React.memo(function ScoreDisplay({
  score,
  onEdit,
}: ScoreDisplayProps): React.ReactElement {
  // Memoize the score color class calculation
  const scoreColorClass = useMemo(() => getScoreColorClass(score?.score), [score?.score]);

  if (!score) {
    return (
      <div className="text-center py-4">
        <p className="mb-4">No score recorded for this day.</p>
        <Button onClick={onEdit}>Add Score</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${scoreColorClass}`}
          >
            {score.score}
          </div>
          <div className="ml-4">
            <h4 className="font-medium">Daily Score</h4>
            {score.is_vacation && <Badge variant="secondary">Vacation Day</Badge>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>

      {score.notes && (
        <div>
          <h4 className="text-sm font-medium mb-1">Notes:</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">{score.notes}</p>
        </div>
      )}
    </div>
  );
});
