'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SystemLogPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: 'ph_measurement',
    value: '',
    unit: 'pH',
    note: ''
  });

  const measurementTypes = [
    { value: 'ph_measurement', label: 'pH Level', unit: 'pH' },
    { value: 'ec_measurement', label: 'EC Level', unit: 'µS/cm' },
    { value: 'tds_measurement', label: 'TDS Level', unit: 'ppm' },
    { value: 'temperature', label: 'Temperature', unit: '°C' },
    { value: 'water_refill', label: 'Water Refill', unit: 'L' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/system/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit log');
      
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error submitting log:', error);
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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Log System Status</h1>

      <form onSubmit={handleSubmit} className="max-w-md bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Measurement Type
          </label>
          <select
            value={formData.type}
            onChange={handleTypeChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            {measurementTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value
          </label>
          <div className="flex items-center">
            <input
              type="number"
              step="0.1"
              required
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              className="flex-1 p-2 border rounded-l focus:ring-2 focus:ring-blue-500"
            />
            <span className="bg-gray-100 px-3 py-2 border-t border-r border-b rounded-r">
              {formData.unit}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Submit Log
          </button>
        </div>
      </form>
    </div>
  );
}
