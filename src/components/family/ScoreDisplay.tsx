import React from 'react';
import { DailyScore } from '../../lib/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ScoreDisplayProps {
  score: DailyScore | null;
  onEdit: () => void;
}

export function ScoreDisplay({ score, onEdit }: ScoreDisplayProps): React.ReactElement {
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
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getScoreColorClass(
              score.score
            )}`}
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
}

function getScoreColorClass(score: number): string {
  switch (score) {
    case 1:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-300';
    case 2:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:bg-opacity-30 dark:text-orange-300';
    case 3:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-30 dark:text-yellow-300';
    case 4:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-300';
    case 5:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:bg-opacity-30 dark:text-emerald-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}
