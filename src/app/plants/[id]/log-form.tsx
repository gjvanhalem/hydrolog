'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/app/components/ImageUpload';

const PLANT_STATUSES = [
  'germination',
  'seedling',
  'vegetative',
  'flowering',
  'fruiting',
  'harvesting',
  'ended'
];

export default function PlantLogForm({ plantId }: { plantId: number }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    status: PLANT_STATUSES[0],
    note: '',
    photo: '' as string,
    logDate: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/plants/${plantId}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: formData.status,
          note: formData.note,
          photo: formData.photo,
          logDate: formData.logDate
        }),
      });

      if (!response.ok) throw new Error('Failed to create log');

      // Reset form and refresh the page
      setFormData({
        status: PLANT_STATUSES[0],
        note: '',
        photo: '',
        logDate: new Date().toISOString().split('T')[0]
      });
      router.refresh();
    } catch (error) {
      console.error('Error creating log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="log-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Log Date
          </label>
          <input
            type="date"
            id="log-date"
            value={formData.logDate}
            onChange={(e) => setFormData(prev => ({ ...prev, logDate: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          >
            {PLANT_STATUSES.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Note
          </label>
          <textarea
            id="note"
            value={formData.note}
            onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={3}
            required
          />
        </div>

        <ImageUpload
          onUpload={(url: string) => setFormData(prev => ({ ...prev, photo: url }))}
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding Log...' : 'Add Log Entry'}
          </button>
        </div>
      </div>
    </form>
  );
}
