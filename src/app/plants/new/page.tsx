'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NewPlantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialPosition, setInitialPosition] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    position: 1, // Default value that will be updated
  });
  
  // Use effect to update position when searchParams changes
  useEffect(() => {
    const positionParam = searchParams?.get('position');
    if (positionParam) {
      const position = parseInt(positionParam);
      if (!isNaN(position) && position >= 1 && position <= 12) {
        setFormData(prev => ({ ...prev, position }));
        setInitialPosition(position);
      }
    }
  }, [searchParams]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/plants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to create plant');
        setIsSubmitting(false);
        return;
      }
      
      router.push('/plants');
      router.refresh();
    } catch (error) {
      console.error('Error creating plant:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Add New Plant</h1>
      {initialPosition > 0 && (
        <div className="mb-4 text-sm dark:text-gray-300">
          Adding plant to position <span className="font-medium">P{initialPosition}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">{error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Plant Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
            placeholder="e.g., Tomato Plant 1"
          />
        </div>

        <div className="mb-4">          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Plant Type
          </label>
          <input
            type="text"
            required
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
            placeholder="e.g., Cherry Tomato"
          />
        </div>        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position {initialPosition > 0 && <span className="text-green-600 dark:text-green-400">(Pre-selected: P{initialPosition})</span>}
          </label>
          <input
            type="number"
            required
            min="1"
            max="12"
            value={formData.position}
            onChange={(e) => setFormData(prev => ({ ...prev, position: parseInt(e.target.value) }))}
            className={`w-full p-2 border rounded ${initialPosition > 0 ? 'border-green-500 dark:border-green-400' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400`}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter the position number (1-12)</p>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-600 dark:bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:bg-green-400 dark:disabled:bg-green-800 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Plant'}
          </button>
        </div>
      </form>
    </div>
  );
}
