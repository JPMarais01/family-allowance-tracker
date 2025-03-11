import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useFamilyData } from '../../hooks/use-family-data';
import { FamilyMember } from '../../lib/types';
import { Button } from '../ui/button';
import { DatePicker } from '../ui/date-picker';
import { ChildScoreCard } from './ChildScoreCard';

export function DailyScores(): React.ReactElement {
  const { user } = useAuth();
  const familyData = useFamilyData(user);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFamilyMembers = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const family = await familyData.getFamilyByOwnerId();
      if (family) {
        const members = await familyData.getFamilyMembers(family.id);
        setFamilyMembers(members.filter(member => member.role === 'child'));
      } else {
        setError('Unable to find family information. Please create a family first.');
      }
    } catch (error) {
      console.error('Error loading family members:', error);
      setError('Failed to load family members. Please try again later.');
    } finally {
      setLoading(false);
    }
    // Remove familyData from the dependency array to prevent infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load family members when component mounts
  useEffect(() => {
    loadFamilyMembers();
  }, [loadFamilyMembers]);

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Daily Scores</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Daily Scores</h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md">
          <p className="text-red-800 dark:text-red-200 mb-3">{error}</p>
          <Button onClick={loadFamilyMembers}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (familyMembers.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Daily Scores</h2>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md">
          <p className="text-yellow-800 dark:text-yellow-200">
            Please add children to your family before using the scoring system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Daily Scores</h2>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Date:</label>
        <div className="max-w-xs">
          <DatePicker date={selectedDate} onDateChange={setSelectedDate} />
        </div>
      </div>

      <div className="space-y-6">
        {familyMembers.map(member => (
          <ChildScoreCard key={member.id} member={member} date={selectedDate} />
        ))}
      </div>
    </div>
  );
}
