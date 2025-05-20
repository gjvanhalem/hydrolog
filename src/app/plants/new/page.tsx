'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PlantSelector from '@/app/components/PlantSelector';
import type { ExternalPlant } from '@/app/api/external/plants/route';
import { fetchWithRetry } from '@/lib/api-utils';

export default function NewPlantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialPosition, setInitialPosition] = useState(1);
  const [maxPosition, setMaxPosition] = useState(12); // Default fallback value
  const [formData, setFormData] = useState({
    name: '', // This will be the display name for the plant
    type: '', // This will be the plant type (from selection or manual input)
    position: 1, // Default value that will be updated
    ph_min: null as number | null,
    ph_max: null as number | null,
    ec_min: null as number | null,
    ec_max: null as number | null,
    ppm_min: null as number | null,
    ppm_max: null as number | null,
    external_id: null as number | null
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // First, fetch the system configuration to get max position
  useEffect(() => {
    const fetchSystemConfig = async () => {      try {
        // Skip if we already have a valid maxPosition value
        if (maxPosition > 1) return;
        
        const response = await fetchWithRetry('/api/system');
        if (response.ok) {
          const data = await response.json();
          // Calculate total positions from positionsPerRow
          const totalPositions = data.positionsPerRow.reduce((sum: number, positions: number) => sum + positions, 0);
          setMaxPosition(totalPositions);
        }
      } catch (error) {
        console.error('Error fetching system config:', error);
      }
    };
    
    fetchSystemConfig();
  }, [maxPosition]);
  
  // Then, handle position from URL params
  useEffect(() => {
    const positionParam = searchParams?.get('position');
    if (positionParam) {
      const position = parseInt(positionParam);
      if (!isNaN(position) && position >= 1 && position <= maxPosition) {
        setFormData(prev => ({ ...prev, position }));
        setInitialPosition(position);
      }
    }
  }, [searchParams, maxPosition]);  // Handle plant selection from the external database
  const handlePlantSelect = (plant: ExternalPlant | null) => {
    if (plant) {
      setFormData(prev => ({
        ...prev,
        name: plant.name, // Use the plant name directly from the database
        type: plant.name, // Use the plant name from the database as the type
        ph_min: plant.ph_min,
        ph_max: plant.ph_max,
        ec_min: plant.ec_min,
        ec_max: plant.ec_max,
        ppm_min: plant.ppm_min,
        ppm_max: plant.ppm_max,
        external_id: plant.id
      }));
    } else {
      // Reset plant parameters if no plant is selected
      setFormData(prev => ({
        ...prev,
        name: '',
        type: '',
        ph_min: null,
        ph_max: null,
        ec_min: null,
        ec_max: null,
        ppm_min: null,
        ppm_max: null,
        external_id: null
      }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
      // Ensure a plant has been selected from the external database
    if (!formData.external_id) {
      setError('You must select a plant from the database to continue. Custom plants cannot be added.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetchWithRetry('/api/plants', {
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
      
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error creating plant:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };  return (
    <div className="p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4 dark:text-white">Add New Plant</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-xl">
        Select a plant from our database to add to your system. 
        All growing parameters will be automatically set based on the selected plant.
      </p>
      {initialPosition > 0 && (
        <div className="mb-4 text-sm dark:text-gray-300">
          Adding plant to position <span className="font-medium">P{initialPosition}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Plant Details</h2>
            <PlantSelector 
            onPlantSelect={handlePlantSelect}
            selectedExternalId={formData.external_id}
          />
            
            <div className="mt-4 mb-4">
            {/* <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plant Name
            </label> */}
            <input
              type="hidden"
              required
              value={formData.name}
              className="w-full p-2 border bg-gray-100 dark:bg-gray-600 rounded dark:border-gray-600 dark:text-gray-100 cursor-not-allowed"
              placeholder="Will be set from selected plant"
              disabled
            />
            {/* <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Name will be exactly as shown in the database</p> */}
          </div>
          
          {/* Hidden input for type field that gets populated automatically */}
          <input 
            type="hidden" 
            name="type" 
            value={formData.type} 
          />
        </div>

        <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">          <h2 className="text-lg font-semibold dark:text-white mb-4">Growth Parameters</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            These values are pre-filled from the plant database but can be customized to your specific needs.
            They will be used for monitoring optimal growing conditions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                pH Range (Min)
              </label>              <input
                type="number"
                step="0.1"
                value={formData.ph_min !== null ? formData.ph_min : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  ph_min: e.target.value ? parseFloat(e.target.value) : null 
                }))}
                className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                placeholder="e.g., 5.5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                pH Range (Max)
              </label>              <input
                type="number"
                step="0.1"
                value={formData.ph_max !== null ? formData.ph_max : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  ph_max: e.target.value ? parseFloat(e.target.value) : null 
                }))}
                className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                placeholder="e.g., 6.5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                EC Range (Min) (mS/cm)
              </label>              <input
                type="number"
                step="0.1"
                value={formData.ec_min !== null ? formData.ec_min : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  ec_min: e.target.value ? parseFloat(e.target.value) : null 
                }))}
                className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                placeholder="e.g., 1.2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                EC Range (Max) (mS/cm)
              </label>              <input
                type="number"
                step="0.1"
                value={formData.ec_max !== null ? formData.ec_max : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  ec_max: e.target.value ? parseFloat(e.target.value) : null 
                }))}
                className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                placeholder="e.g., 2.4"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PPM Range (Min)
              </label>              <input
                type="number"
                value={formData.ppm_min !== null ? formData.ppm_min : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  ppm_min: e.target.value ? parseInt(e.target.value) : null 
                }))}
                className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                placeholder="e.g., 840"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                PPM Range (Max)
              </label>              <input
                type="number"
                value={formData.ppm_max !== null ? formData.ppm_max : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  ppm_max: e.target.value ? parseInt(e.target.value) : null 
                }))}
                className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                placeholder="e.g., 1260"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position {initialPosition > 0 && <span className="text-green-600 dark:text-green-400">(Pre-selected: P{initialPosition})</span>}
          </label>
          <input
            type="number"
            required
            min="1"
            max={maxPosition}
            value={formData.position}
            onChange={(e) => setFormData(prev => ({ ...prev, position: parseInt(e.target.value) }))}
            className={`w-full p-2 border rounded ${initialPosition > 0 ? 'border-green-500 dark:border-green-400' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400`}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter the position number (1-{maxPosition})</p>
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
