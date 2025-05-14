'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RemoveAllPlantsButton() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRemoveAllPlants = async () => {
    try {
      setIsRemoving(true);
      setError('');
      
      const response = await fetch('/api/plants/remove-all', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove all plants');
      }
      
      // Close the confirmation dialog and refresh the page
      setShowConfirmation(false);
      router.refresh();
    } catch (error) {
      console.error('Error removing all plants:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove all plants');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowConfirmation(true)}
        className="bg-red-600 dark:bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
      >
        Remove All Plants
      </button>
      
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Confirm Removal</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This action will remove all plants from your system. All plants will be marked as removed and their positions will be cleared. This action cannot be undone.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}
            
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={isRemoving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveAllPlants}
                disabled={isRemoving}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:bg-red-400 dark:disabled:bg-red-800 transition-colors"
              >
                {isRemoving ? 'Removing...' : 'Yes, Remove All Plants'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
