'use client';

import { useState, useEffect } from 'react';
import type { ExternalPlant } from '@/app/api/external/plants/route';
import { fetchWithRetry } from '@/lib/api-utils';
import { sessionCache } from '@/lib/local-cache';

interface PlantSelectorProps {
  onPlantSelect: (plant: ExternalPlant | null) => void;
  selectedExternalId?: number | null;
}

export default function PlantSelector({ onPlantSelect, selectedExternalId }: PlantSelectorProps) {
  const [externalPlants, setExternalPlants] = useState<ExternalPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<ExternalPlant | null>(null);
  const [latestMeasurements, setLatestMeasurements] = useState<Record<string, number>>({});
  
  // Fetch the latest system measurements
  useEffect(() => {
    const fetchLatestMeasurements = async () => {
      try {
        const response = await fetch('/api/system/logs?activeOnly=true');
        
        if (response.ok) {
          const logsData = await response.json();
          
          // Group logs by type, keeping only the latest
          const logsByType: Record<string, any> = {};
          logsData.forEach((log: any) => {
            if (!logsByType[log.type] || new Date(log.logDate) > new Date(logsByType[log.type].logDate)) {
              logsByType[log.type] = log;
            }
          });
          
          // Extract the latest values for each measurement type
          const measurements: Record<string, number> = {};
          Object.values(logsByType).forEach((log: any) => {
            measurements[log.type] = log.value;
          });
          
          setLatestMeasurements(measurements);
        }
      } catch (error) {
        console.error('Failed to fetch system logs:', error);
      }
    };
    
    fetchLatestMeasurements();
  }, []);
  
  useEffect(() => {
    async function fetchExternalPlants() {
      try {
        // Don't refetch if we already have the plants
        if (externalPlants.length > 0) {
          // Only update selection if needed
          if (selectedExternalId) {
            const matchingPlant = externalPlants.find(plant => plant.id === selectedExternalId);
            if (matchingPlant && !selectedPlant) {
              setSelectedPlant(matchingPlant);
              onPlantSelect(matchingPlant);
            }
          }
          return;
        }
        
        // Check if we have cached plant data and if we're in a browser environment
        const isBrowser = typeof window !== 'undefined';
        let cachedPlants: ExternalPlant[] | null = null;
        
        if (isBrowser) {
          cachedPlants = sessionCache.get<ExternalPlant[]>('externalPlants');
          if (cachedPlants && cachedPlants.length > 0) {
            console.log('Using cached plant data');
            setExternalPlants(cachedPlants);
            
            if (selectedExternalId) {
              const matchingPlant = cachedPlants.find(plant => plant.id === selectedExternalId);
              if (matchingPlant) {
                setSelectedPlant(matchingPlant);
                onPlantSelect(matchingPlant);
              }
            }
            
            setLoading(false);
            return;
          }
        }
        
        setLoading(true);
        const response = await fetchWithRetry('/api/external/plants');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch plants: ${response.statusText}`);
        }
        
        const data = await response.json();
        setExternalPlants(data);
        
        // Cache the plant data for future use (cache for 30 minutes) only if in browser
        if (isBrowser) {
          sessionCache.set('externalPlants', data, 1800);
        }
        
        // If a selected external ID is provided, find the matching plant
        if (selectedExternalId) {
          const matchingPlant = data.find((plant: ExternalPlant) => plant.id === selectedExternalId);
          if (matchingPlant) {
            setSelectedPlant(matchingPlant);
            onPlantSelect(matchingPlant);
          }
        }
      } catch (err) {
        console.error('Error fetching external plants:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchExternalPlants();
  }, [selectedExternalId, onPlantSelect, externalPlants, selectedPlant]);
  const handlePlantSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    
    if (selectedId === -1) {
      // Clear selection
      setSelectedPlant(null);
      onPlantSelect(null);
      return;
    }
    
    const plant = externalPlants.find(p => p.id === selectedId);
    if (plant) {
      setSelectedPlant(plant);
      onPlantSelect(plant);
    }
  };

  // Helper function to check if a parameter is out of bounds
  const isParameterOutOfBounds = (minValue: number | null, maxValue: number | null, currentValue: number | undefined) => {
    if (currentValue === undefined || (minValue === null && maxValue === null)) return false;
    
    if (minValue !== null && currentValue < minValue) return true;
    if (maxValue !== null && currentValue > maxValue) return true;
    
    return false;
  };

  // Get the current measurement values
  const currentPh = latestMeasurements['ph_measurement'];
  const currentEc = latestMeasurements['ec_measurement'] !== undefined ? 
    latestMeasurements['ec_measurement'] / 1000 : undefined; // Convert µS/cm to mS/cm
  const currentPpm = latestMeasurements['tds_measurement'];

  // Check which plant parameters are out of bounds
  const isPhOutOfBounds = selectedPlant ? 
    isParameterOutOfBounds(selectedPlant.ph_min, selectedPlant.ph_max, currentPh) : false;
  const isEcOutOfBounds = selectedPlant ? 
    isParameterOutOfBounds(selectedPlant.ec_min, selectedPlant.ec_max, currentEc) : false;
  const isPpmOutOfBounds = selectedPlant ? 
    isParameterOutOfBounds(selectedPlant.ppm_min, selectedPlant.ppm_max, currentPpm) : false;

  if (loading) {
    return <div className="text-center p-4">Loading plant database...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md">
        Failed to load plant database: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          First, Select a Plant <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedPlant?.id || -1}
          onChange={handlePlantSelect}
          className="w-full p-2 border rounded dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
          required
        >
          <option value={-1}>Select a plant from the database</option>
          {externalPlants.map(plant => (
            <option key={plant.id} value={plant.id}>
              {plant.name}
            </option>
          ))}
        </select>
      </div>
        {selectedPlant && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 rounded-md">
          <h3 className="font-medium text-green-700 dark:text-green-300 mb-2">Selected Plant Parameters</h3>
          {(isPhOutOfBounds || isEcOutOfBounds || isPpmOutOfBounds) && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
              <span className="font-medium">Warning:</span> Some parameters are outside the recommended range for this plant.
            </div>
          )}<div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="font-medium">pH Range:</span>{' '}
              <span className={isPhOutOfBounds ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                {selectedPlant.ph_min} - {selectedPlant.ph_max}
                {currentPh !== undefined && (
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    (Current: {currentPh.toFixed(1)})
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="font-medium">EC Range:</span>{' '}
              <span className={isEcOutOfBounds ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                {selectedPlant.ec_min} - {selectedPlant.ec_max} mS/cm
                {currentEc !== undefined && (
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    (Current: {currentEc.toFixed(2)} mS/cm)
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="font-medium">PPM Range:</span>{' '}
              <span className={isPpmOutOfBounds ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                {selectedPlant.ppm_min} - {selectedPlant.ppm_max} ppm
                {currentPpm !== undefined && (
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    (Current: {currentPpm.toFixed(0)} ppm)
                  </span>
                )}
              </span>
            </div>          </div>
          
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 italic">
            <p>Parameters in <span className="text-red-600 dark:text-red-400 font-medium">red</span> indicate current system values are outside the recommended range for this plant.</p>
          </div>
        </div>
      )}
    </div>
  );
}