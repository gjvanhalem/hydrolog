'use client';

import { useState } from 'react';
import { fetchWithRetry } from '@/lib/api-utils';

interface ParameterFormValues {
  ph_min: string;
  ph_max: string;
  ec_min: string;
  ec_max: string;
  ppm_min: string;
  ppm_max: string;
}

interface EditableParametersProps {
  plantId: number;
  initialValues: {
    ph_min: number | null;
    ph_max: number | null;
    ec_min: number | null;
    ec_max: number | null;
    ppm_min: number | null;
    ppm_max: number | null;
  };
  onCancel: () => void;
  onSave: () => void;
}

export default function EditableParameters({ 
  plantId, 
  initialValues,
  onCancel,
  onSave
}: EditableParametersProps) {
  const [formValues, setFormValues] = useState<ParameterFormValues>({
    ph_min: initialValues.ph_min !== null ? initialValues.ph_min.toString() : '',
    ph_max: initialValues.ph_max !== null ? initialValues.ph_max.toString() : '',
    ec_min: initialValues.ec_min !== null ? initialValues.ec_min.toString() : '',
    ec_max: initialValues.ec_max !== null ? initialValues.ec_max.toString() : '',
    ppm_min: initialValues.ppm_min !== null ? initialValues.ppm_min.toString() : '',
    ppm_max: initialValues.ppm_max !== null ? initialValues.ppm_max.toString() : '',
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleClearField = (field: keyof ParameterFormValues) => {
    setFormValues(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // Convert empty strings to null and strings to numbers
      const payload = {
        ph_min: formValues.ph_min === '' ? null : parseFloat(formValues.ph_min),
        ph_max: formValues.ph_max === '' ? null : parseFloat(formValues.ph_max),
        ec_min: formValues.ec_min === '' ? null : parseFloat(formValues.ec_min),
        ec_max: formValues.ec_max === '' ? null : parseFloat(formValues.ec_max),
        ppm_min: formValues.ppm_min === '' ? null : parseInt(formValues.ppm_min),
        ppm_max: formValues.ppm_max === '' ? null : parseInt(formValues.ppm_max)
      };

      // Basic validation
      if (payload.ph_min !== null && payload.ph_max !== null && payload.ph_min > payload.ph_max) {
        setError('pH minimum value cannot be greater than maximum value');
        setIsSaving(false);
        return;
      }

      if (payload.ec_min !== null && payload.ec_max !== null && payload.ec_min > payload.ec_max) {
        setError('EC minimum value cannot be greater than maximum value');
        setIsSaving(false);
        return;
      }

      if (payload.ppm_min !== null && payload.ppm_max !== null && payload.ppm_min > payload.ppm_max) {
        setError('PPM minimum value cannot be greater than maximum value');
        setIsSaving(false);
        return;
      }

      const response = await fetchWithRetry(`/api/plants/${plantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update parameters');
      }

      // Success - call the onSave callback to refresh the parent component
      onSave();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving parameters');
      console.error('Error updating plant parameters:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Edit Growth Parameters</h3>
      
      {error && (
        <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            pH Range (Min)
          </label>
          <div className="relative">
            <input
              type="number"
              name="ph_min"
              step="0.1"
              value={formValues.ph_min}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="e.g., 5.5"
            />
            {formValues.ph_min && (
              <button 
                type="button"
                onClick={() => handleClearField('ph_min')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            pH Range (Max)
          </label>
          <div className="relative">
            <input
              type="number"
              name="ph_max"
              step="0.1"
              value={formValues.ph_max}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="e.g., 6.5"
            />
            {formValues.ph_max && (
              <button 
                type="button"
                onClick={() => handleClearField('ph_max')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            EC Range (Min) (mS/cm)
          </label>
          <div className="relative">
            <input
              type="number"
              name="ec_min"
              step="0.1"
              value={formValues.ec_min}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="e.g., 1.2"
            />
            {formValues.ec_min && (
              <button 
                type="button"
                onClick={() => handleClearField('ec_min')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            EC Range (Max) (mS/cm)
          </label>
          <div className="relative">
            <input
              type="number"
              name="ec_max"
              step="0.1"
              value={formValues.ec_max}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="e.g., 2.4"
            />
            {formValues.ec_max && (
              <button 
                type="button"
                onClick={() => handleClearField('ec_max')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            PPM Range (Min)
          </label>
          <div className="relative">
            <input
              type="number"
              name="ppm_min"
              value={formValues.ppm_min}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="e.g., 840"
            />
            {formValues.ppm_min && (
              <button 
                type="button"
                onClick={() => handleClearField('ppm_min')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            PPM Range (Max)
          </label>
          <div className="relative">
            <input
              type="number"
              name="ppm_max"
              value={formValues.ppm_max}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="e.g., 1260"
            />
            {formValues.ppm_max && (
              <button 
                type="button"
                onClick={() => handleClearField('ppm_max')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
