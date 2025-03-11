import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { DailyScores } from './family/DailyScores';
import { FamilyManagement } from './family/FamilyManagement';

export function Dashboard(): React.ReactElement {
  const { user, familyMember } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'family' | 'scores'>(
    familyMember ? 'scores' : 'overview'
  );

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Dashboard</h2>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  activeTab === 'overview'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('family')}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  activeTab === 'family'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Family Management
              </button>
              <button
                onClick={() => setActiveTab('scores')}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  activeTab === 'scores'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Daily Scores
              </button>
            </nav>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Logged in as:</span>
                <br />
                <span className="font-medium">{familyMember?.name || user.email}</span>
              </p>
              {familyMember && (
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Role:</span>
                  <br />
                  <span className="font-medium capitalize">{familyMember.role}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Welcome to Family Allowance Tracker</h2>
                <p className="mb-4">
                  This dashboard helps you manage your family's allowances based on daily scores.
                </p>
                <div className="p-4 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-md">
                  <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Create your family in the Family Management section</li>
                    <li>Add family members (children and parents)</li>
                    <li>Set base allowances for each child</li>
                    <li>Start tracking daily scores</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTab === 'family' && <FamilyManagement />}

            {activeTab === 'scores' && <DailyScores />}
          </div>
        </div>
      </div>
    </div>
  );
}
