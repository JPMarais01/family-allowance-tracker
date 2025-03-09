import React, { useState } from 'react';
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <div>Please log in to manage your family.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">Family Management</h2>
        {!family ? (
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
                <h3 className="text-xl font-semibold">{family.name}</h3>
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
                      <span className="text-gray-600 dark:text-gray-400">Name:</span> {family.name}
                    </p>
                    <p>
                      <span className="text-gray-600 dark:text-gray-400">Created:</span>{' '}
                      {new Date(family.created_at).toLocaleDateString()}
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
