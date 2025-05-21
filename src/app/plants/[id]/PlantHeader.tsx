'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PlantHeaderProps {
  id: number;
  name: string;
  type: string;
  position?: number | null;
  status: string;
}

export default function PlantHeader({ id, name, type, position, status }: PlantHeaderProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDelete = async () => {
    // If plant is not ended and we haven't shown the confirmation dialog
    if (status !== 'ended' && !showConfirmDialog) {
      setShowConfirmDialog(true);
      return;
    }    try {
      setIsDeleting(true);
      const response = await fetch(`/api/plants/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete plant');
      }

      router.refresh();
      router.push('/');
    } catch (error) {
      console.error('Error deleting plant:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete plant. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowConfirmDialog(false);
    }
  };
  return (
    <div className="mb-8">
      <div className="flex justify-between items-start mb-2">
        <h1 className="text-3xl font-bold dark:text-white">{name}</h1>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:bg-red-400 dark:disabled:bg-red-800 transition-colors"
        >
          {isDeleting ? 'Removing...' : 'Remove Plant'}
        </button>
      </div>

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2 dark:text-white">Confirm Removal</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This plant is still active. Are you sure you want to remove it from position {position}?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                Remove Plant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
