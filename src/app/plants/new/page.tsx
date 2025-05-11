'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPlantPage() {
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const initialPosition = parseInt(searchParams.get('position') || '1');

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    position: initialPosition,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/plants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create plant');
      
      router.push('/plants');
      router.refresh();
    } catch (error) {
      console.error('Error creating plant:', error);
    }
  };

  return (    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Add New Plant</h1><form onSubmit={handleSubmit} className="max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
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
        </div>

        <div className="mb-6">          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position
          </label>
          <input
            type="number"
            required
            min="1"
            max="12"
            value={formData.position}
            onChange={(e) => setFormData(prev => ({ ...prev, position: parseInt(e.target.value) }))}
            className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
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
          </button>
          <button
            type="submit"
            className="bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
          >
            Add Plant
          </button>
        </div>
      </form>
    </div>
  );
}
