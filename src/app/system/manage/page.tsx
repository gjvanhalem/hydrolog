'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthContext';
import Link from 'next/link';
import SystemLayoutEditor from './system-layout-editor';
import RemoveAllPlantsButton from '@/app/components/RemoveAllPlantsButton';

// Form state for adding a new system
type NewSystemForm = {
  name: string;
  rows: number;
  positionsPerRow: number[];
};

export default function SystemManagePage() {
  const router = useRouter();
  const { user, addSystem, removeSystem, getActiveSystem } = useAuth();
  
  // States
  const [isAddingSystem, setIsAddingSystem] = useState(false);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  
  // New system form state
  const [newSystemForm, setNewSystemForm] = useState<NewSystemForm>({
    name: '',
    rows: 1,
    positionsPerRow: [8] // Default to 1 row with 8 positions
  });

  // Get the active system
  const activeSystem = getActiveSystem();

  // Handle adding a new row in the system layout
  const handleAddRow = () => {
    setNewSystemForm(prev => ({
      ...prev,
      rows: prev.rows + 1,
      positionsPerRow: [...prev.positionsPerRow, 8] // Default to 8 positions for new row
    }));
  };

  // Handle removing a row from the system layout
  const handleRemoveRow = (index: number) => {
    if (newSystemForm.rows <= 1) return;
    
    setNewSystemForm(prev => {
      const newPositions = [...prev.positionsPerRow];
      newPositions.splice(index, 1);
      return {
        ...prev,
        rows: prev.rows - 1,
        positionsPerRow: newPositions
      };
    });
  };

  // Handle changing positions per row
  const handlePositionsChange = (index: number, value: number) => {
    const positionsValue = Math.min(Math.max(value, 0), 24); // Limit between 0-24 positions
    
    setNewSystemForm(prev => {
      const newPositions = [...prev.positionsPerRow];
      newPositions[index] = positionsValue;
      return {
        ...prev,
        positionsPerRow: newPositions
      };
    });
  };

  // Handle form submission to add a new system
  const handleAddSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await addSystem(newSystemForm);
      
      if (result.success) {
        setSuccessMessage(`System "${newSystemForm.name}" added successfully!`);
        setNewSystemForm({
          name: '',
          rows: 1,
          positionsPerRow: [8]
        });
        setIsAddingSystem(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to add system');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error adding system:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle system removal
  const handleRemoveSystem = async (systemId: number) => {
    if (confirmRemove !== systemId) {
      // First click - ask for confirmation
      setConfirmRemove(systemId);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await removeSystem(systemId);
      
      if (result.success) {
        setSuccessMessage('System removed successfully!');
        setConfirmRemove(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to remove system');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error removing system:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel removal confirmation
  const cancelRemove = () => {
    setConfirmRemove(null);
  };

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="mb-4">You need to be logged in to manage systems.</p>
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Manage Systems</h1>
      
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 mb-4 rounded">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
          {error}
        </div>
      )}
      
      {/* Systems List */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Systems</h2>
        
        {user.systems && user.systems.length > 0 ? (
          <div className="space-y-4">
            {user.systems.map((userSystem) => (
              <div 
                key={userSystem.systemId}
                className={`flex flex-col p-3 rounded-md ${
                  userSystem.isActive 
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                    : 'bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium flex items-center">
                      {userSystem.system.name}
                      {userSystem.isActive && (
                        <span className="ml-2 text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {userSystem.system.rows} row{userSystem.system.rows !== 1 ? 's' : ''}, 
                      {' '}{(userSystem.system.positionsPerRow as number[]).reduce((a, b) => a + b, 0)} positions
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {confirmRemove === userSystem.systemId ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRemoveSystem(userSystem.systemId)}
                          disabled={isSubmitting}
                          className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={cancelRemove}
                          className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        {userSystem.isActive && (
                          <button
                            onClick={() => setIsEditingLayout(true)}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-sm hover:bg-blue-200 dark:hover:bg-blue-800/30 mr-2"
                            title="Update system layout"
                          >
                            Edit Layout
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmRemove(userSystem.systemId)}
                          disabled={isSubmitting || user.systems?.length === 1} // Prevent removing the last system
                          className={`px-3 py-1 rounded-md text-sm ${
                            user.systems?.length === 1
                              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/30'
                          }`}
                          title={user.systems?.length === 1 ? "You can't remove your only system" : "Remove this system"}
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>                {/* System Actions */}
                {userSystem.isActive && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                    <Link 
                      href="/record"
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-sm hover:bg-green-200 dark:hover:bg-green-800/30 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Record Data
                    </Link>                    <Link 
                      href="/reports"
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-md text-sm hover:bg-purple-200 dark:hover:bg-purple-800/30 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      View Reports
                    </Link>                    <Link 
                      href={`/system/history/${userSystem.systemId}`}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-sm hover:bg-blue-200 dark:hover:bg-blue-800/30 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Plant History
                    </Link>
                    <Link 
                      href="/system/advisor"
                      className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md text-sm hover:bg-amber-200 dark:hover:bg-amber-800/30 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Advisor
                    </Link>
                    <div className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <RemoveAllPlantsButton 
                        systemId={userSystem.systemId} 
                        systemName={userSystem.system.name}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>        ) : (
          <p className="text-gray-500 dark:text-gray-400">You don't have any systems yet.</p>
        )}      </div>
      
      {/* Add System Section */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-md p-6">
        {isAddingSystem ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Add New System</h2>
            
            <form onSubmit={handleAddSystem}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">System Name</label>
                <input
                  type="text"
                  value={newSystemForm.name}
                  onChange={(e) => setNewSystemForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="My Hydroponic System"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">System Layout</label>
                
                <div className="space-y-3">
                  {Array.from({ length: newSystemForm.rows }).map((_, index) => (
                    <div key={index} className="flex space-x-2 items-center">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Row {index + 1}</label>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={newSystemForm.positionsPerRow[index]}
                          onChange={(e) => handlePositionsChange(index, parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="Number of positions"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        disabled={newSystemForm.rows <= 1}
                        className={`mt-5 p-1 rounded-full ${
                          newSystemForm.rows <= 1 
                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                            : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30'
                        }`}
                        title={newSystemForm.rows <= 1 ? "Can't remove the only row" : "Remove this row"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="flex items-center text-green-600 hover:text-green-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Row
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting || newSystemForm.name.trim() === ''}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add System'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsAddingSystem(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={() => setIsAddingSystem(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add New System
            </button>
          </div>
        )}
      </div>
      
      {/* System Layout Editor Modal */}
      {isEditingLayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <SystemLayoutEditor onClose={() => setIsEditingLayout(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
