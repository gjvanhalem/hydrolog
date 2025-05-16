'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const measurementTypes = [
  { value: 'ph_measurement', label: 'pH Level', unit: 'pH' },
  { value: 'ec_measurement', label: 'EC Level', unit: 'µS/cm' },
  { value: 'tds_measurement', label: 'TDS Level', unit: 'ppm' },
  { value: 'temperature', label: 'Temperature', unit: '°C' },
  { value: 'water_refill', label: 'Water Refill', unit: 'L' }
] as const;

type MeasurementType = typeof measurementTypes[number]['value'];

interface FormData {
  type: MeasurementType;
  value: string;
  unit: string;
  note: string;
  logDate: string;
}

interface SystemInfo {
  id: number;
  name: string;
}

export default function SystemLogForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    type: 'ph_measurement',
    value: '',
    unit: 'pH',
    note: '',
    logDate: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
  });
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);
    // Fetch the user's system information
  useEffect(() => {
    async function fetchSystemInfo() {
      try {
        const response = await fetch('/api/system');
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setSystemInfo(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch system info:', err);
      }
    }
    
    fetchSystemInfo();
  }, []);
  // Handle redirect when submission is successful
  useEffect(() => {
    if (shouldRedirect) {
      // Go directly to the reports page with log-history tab
      window.location.href = '/reports?tab=log-history';
    }
  }, [shouldRedirect, router]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/system/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          value: Number(formData.value),
          logDate: formData.logDate,
          systemId: systemInfo?.id || null
        }),
      });      if (!response.ok) {
        throw new Error('Failed to submit measurement');
      }
      
      console.log('Measurement submitted successfully, triggering redirect...');
      
      // Trigger the redirect via state change
      setShouldRedirect(true);
    } catch (error) {
      // Set the error message for the user to see
      setError(error instanceof Error ? error.message : 'Failed to submit measurement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = measurementTypes.find(type => type.value === e.target.value);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        type: selectedType.value,
        unit: selectedType.unit
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded">
          {error}
        </div>
      )}

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
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Measurement Type
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={handleTypeChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-3 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-colors"
            required
          >
            {measurementTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Value
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              id="value"
              step="0.1"
              value={formData.value}
              onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
              className="block w-full rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-3 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-colors"
              required
            />
            <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 px-3 text-gray-500 dark:text-gray-400 sm:text-sm">
              {formData.unit}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Note (Optional)
          </label>
          <textarea
            id="note"
            value={formData.note}
            onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-2 px-3 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-colors"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-green-600 dark:bg-green-700 px-4 py-2 text-white hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-green-400 dark:disabled:bg-green-800 transition-colors"
        >
          {isSubmitting ? 'Recording...' : 'Record Measurement'}
        </button>
      </div>
    </form>
  );
}
