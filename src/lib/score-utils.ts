/**
 * Utility functions for working with scores
 */

/**
 * Returns a CSS class string for styling score elements based on the score value
 */
export function getScoreColorClass(score: number | undefined): string {
  if (score === undefined) {
    return '';
  }

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
