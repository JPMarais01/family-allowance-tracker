import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useFamily } from '../../hooks/use-family';
import { Spinner } from '../ui/spinner';
import { AddFamilyMemberForm } from './AddFamilyMemberForm';
import { CreateFamilyForm } from './CreateFamilyForm';
import { FamilyMembersList } from './FamilyMembersList';

export function FamilyManagement(): React.ReactElement {
  const { user } = useAuth();
  const { family, loading } = useFamily();
  const [activeTab, setActiveTab] = useState<'overview' | 'members'>('overview');

  // Add state to track if we've ever had family data
  const [hadFamily, setHadFamily] = useState<boolean>(false);

  // Track if we've ever had family data
  useEffect(() => {
    if (family) {
      setHadFamily(true);
    }
  }, [family]);

  // Only show loading spinner on initial load, not if we had data before
  if (loading && !hadFamily) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <div>Please log in to manage your family.</div>;
  }

  // If we're loading but had family data before, use the last known family data
  const displayFamily =
    family ||
    (hadFamily && loading ? { name: 'Loading...', created_at: new Date().toISOString() } : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">Family Management</h2>
        {!displayFamily ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Create Your Family</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              You don't have a family set up yet. Create one to start tracking allowances.
            </p>
            <CreateFamilyForm />
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{displayFamily.name}</h3>
                <div className="flex space-x-2">
                  <button
                    className={`px-4 py-2 rounded-md ${
                      activeTab === 'overview'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`px-4 py-2 rounded-md ${
                      activeTab === 'members'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                    onClick={() => setActiveTab('members')}
                  >
                    Members
                  </button>
                </div>
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <h4 className="font-medium mb-2">Family Details</h4>
                    <p>
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>{' '}
                      {displayFamily.name}
                    </p>
                    <p>
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>{' '}
                      {new Date(displayFamily.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-4">
                  <AddFamilyMemberForm />
                  <FamilyMembersList />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
