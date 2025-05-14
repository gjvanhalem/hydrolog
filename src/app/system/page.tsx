"use client";

import { metadata } from './metadata';
import Link from 'next/link';
import { useState } from 'react';

export default function SystemPage() {
  const [positionsPerRow, setPositionsPerRow] = useState<number[]>([0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">System Management</h1>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-md mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="positionsPerRow" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Positions Per Row
          </label>
          {positionsPerRow.map((row, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="number"
                value={row}
                onChange={(e) => handleRowChange(index, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder={`Positions for Row ${index + 1}`}
                required
              />
              <button
                type="button"
                onClick={() => handleRemoveRow(index)}
                className="px-2 py-1 bg-red-500 text-white rounded-md"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddRow}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Add Row
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 focus:ring-green-500 focus:ring-offset-green-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {isSubmitting ? 'Updating Layout...' : 'Update Layout'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Link 
          href="/system/daily"
          className="group block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 hover:shadow-xl dark:hover:shadow-gray-900/80 transition-all duration-200"
        >
          <h2 className="text-xl font-semibold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Daily Log</h2>
          <p className="text-gray-600 dark:text-gray-400">View today's system measurements and logs</p>
        </Link>

        <Link 
          href="/system/record"
          className="group block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 hover:shadow-xl dark:hover:shadow-gray-900/80 transition-all duration-200"
        >
          <h2 className="text-xl font-semibold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Record Measurement</h2>
          <p className="text-gray-600 dark:text-gray-400">Record a new system measurement or log</p>
        </Link>
      </div>
    </div>
  );
}
