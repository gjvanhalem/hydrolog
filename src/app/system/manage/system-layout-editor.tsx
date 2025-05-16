'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthContext';

type SystemLayoutEditorProps = {
  onClose: () => void;
};

export default function SystemLayoutEditor({ onClose }: SystemLayoutEditorProps) {
  const { getActiveSystem } = useAuth();
  const activeSystem = getActiveSystem();
  
  const [positionsPerRow, setPositionsPerRow] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Initialize positions from active system
  useEffect(() => {
    if (activeSystem?.system) {
      try {
        // Get positions from active system
        const systemData = activeSystem.system;
        // Handle positions data which might be stored in different formats
        let positions: number[] = [0];
        
        if (systemData && 'positionsPerRow' in systemData) {
          const rawPositions = systemData.positionsPerRow;
          
          if (Array.isArray(rawPositions)) {
            positions = rawPositions;
          } else if (typeof rawPositions === 'string') {
            try {
              const parsed = JSON.parse(rawPositions);
              if (Array.isArray(parsed)) {
                positions = parsed;
              }
            } catch (e) {
              console.error('Failed to parse positions data', e);
            }
          }
        }
        
        setPositionsPerRow(positions);
      } catch (err) {
        console.error('Error parsing system data:', err);
        setPositionsPerRow([0]);
      }
    } else {
      setPositionsPerRow([0]);
    }
  }, [activeSystem]);

  const handleRowChange = (index: number, value: string) => {
    const updatedRows = [...positionsPerRow];
    updatedRows[index] = parseInt(value, 10) || 0;
    setPositionsPerRow(updatedRows);
  };

  const handleAddRow = () => {
    setPositionsPerRow([...positionsPerRow, 0]);
  };

  const handleRemoveRow = (index: number) => {
    setPositionsPerRow(positionsPerRow.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!confirm('Changing the layout will remove all plants and reset the system. Do you want to proceed?')) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/system/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionsPerRow: positionsPerRow.map(Number) })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update system layout');
      }

      setSuccess('System layout updated successfully');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating the system layout');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeSystem) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Update System Layout</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No active system selected. Please select a system first.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Update System Layout for {activeSystem.system.name}</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Configure your hydroponic system's layout by defining the number of plant positions in each row.
            <br />
            <span className="text-sm italic text-amber-700 dark:text-amber-400">Important: Changing the layout will remove all plants from the system.</span>
          </p>
          
          <div className="space-y-3 my-4">
            {positionsPerRow.map((positions, index) => (
              <div key={index} className="flex items-center space-x-2">
                <label className="w-20 text-gray-700 dark:text-gray-300">Row {index + 1}:</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={positions}
                  onChange={(e) => handleRowChange(index, e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 w-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <span className="text-gray-600 dark:text-gray-400">positions</span>
                
                {positionsPerRow.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(index)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
                    title="Remove row"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button
            type="button"
            onClick={handleAddRow}
            className="text-blue-600 dark:text-blue-400 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Add Row
          </button>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isSubmitting ? 'Updating...' : 'Update Layout'}
          </button>
        </div>
      </form>
    </div>
  );
}
