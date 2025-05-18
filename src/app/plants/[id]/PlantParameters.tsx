'use client';

import { useEffect, useState } from 'react';
import type { ExternalPlant } from '@/app/api/external/plants/route';
import { fetchWithRetry } from '@/lib/api-utils';
import { sessionCache } from '@/lib/local-cache';
import EditableParameters from './EditableParameters';

interface SystemLog {
  id: number;
  type: string;
  value: number;
  unit: string;
  logDate: string;
}

interface PlantDetailsProps {
  plantId: number;
  externalId?: number | null;
  ph_min?: number | null;
  ph_max?: number | null;
  ec_min?: number | null;
  ec_max?: number | null;
  ppm_min?: number | null;
  ppm_max?: number | null;
}

export default function PlantParameters({ 
  plantId, 
  externalId,
  ph_min: passedPhMin,
  ph_max: passedPhMax,
  ec_min: passedEcMin,
  ec_max: passedEcMax,
  ppm_min: passedPpmMin,
  ppm_max: passedPpmMax
}: PlantDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [plantData, setPlantData] = useState<ExternalPlant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestMeasurements, setLatestMeasurements] = useState<Record<string, number>>({});

  // Fetch the latest system measurements
  useEffect(() => {
    const fetchLatestMeasurements = async () => {
      try {
        const response = await fetch('/api/system/logs?activeOnly=true');
        
        if (response.ok) {
          const logsData = await response.json();
          
          // Group logs by type, keeping only the latest
          const logsByType: Record<string, SystemLog> = {};
          logsData.forEach((log: SystemLog) => {
            if (!logsByType[log.type] || new Date(log.logDate) > new Date(logsByType[log.type].logDate)) {
              logsByType[log.type] = log;
            }
          });
          
          // Extract the latest values for each measurement type
          const measurements: Record<string, number> = {};
          Object.values(logsByType).forEach(log => {
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
    // Only fetch if we have an external ID
    if (!externalId) return;

    async function fetchPlantDetails() {
      try {
        setLoading(true);
        setError(null);
        
        // First check if we have cached plant data
        const cachedPlants = sessionCache.get<ExternalPlant[]>('externalPlants');
        if (cachedPlants && cachedPlants.length > 0) {
          const matchingPlant = cachedPlants.find(plant => plant.id === externalId);
          if (matchingPlant) {
            setPlantData(matchingPlant);
            setLoading(false);
            return;
          }
        }
        
        const response = await fetchWithRetry('/api/external/plants');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch plant details: ${response.statusText}`);
        }
        
        const data: ExternalPlant[] = await response.json();
        
        // Cache the data
        sessionCache.set('externalPlants', data, 1800);
        
        const matchingPlant = data.find(plant => plant.id === externalId);
        
        if (matchingPlant) {
          setPlantData(matchingPlant);
        } else {
          setError(`Could not find plant with external ID ${externalId}`);
        }
      } catch (err) {
        console.error('Error fetching plant details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load plant information');
      } finally {
        setLoading(false);
      }
    }

    fetchPlantDetails();
  }, [externalId]);  // Check if a parameter is outside its acceptable range
  const isParameterOutOfRange = (minValue: number | null, maxValue: number | null, currentValue: number | null | undefined): boolean => {
    if (currentValue === undefined || currentValue === null) return false;
    if (minValue === null && maxValue === null) return false;
    
    const min = minValue !== null ? Number(minValue) : Number.MIN_SAFE_INTEGER;
    const max = maxValue !== null ? Number(maxValue) : Number.MAX_SAFE_INTEGER;
    const current = Number(currentValue);
    
    return current < min || current > max;  };
  // Process parameters for display
  // Always prioritize user-modified parameters over database values
  const paramData: {
    ph_min: number | null;
    ph_max: number | null;
    ec_min: number | null;
    ec_max: number | null;
    ppm_min: number | null;
    ppm_max: number | null;
  } = {
    // Use passed parameters if they exist, otherwise use external database values if available
    ph_min: passedPhMin ?? (externalId && plantData ? plantData.ph_min : null),
    ph_max: passedPhMax ?? (externalId && plantData ? plantData.ph_max : null),
    ec_min: passedEcMin ?? (externalId && plantData ? plantData.ec_min : null),
    ec_max: passedEcMax ?? (externalId && plantData ? plantData.ec_max : null),
    ppm_min: passedPpmMin ?? (externalId && plantData ? plantData.ppm_min : null),
    ppm_max: passedPpmMax ?? (externalId && plantData ? plantData.ppm_max : null)
  };
  // Check which parameters are out of range
  const currentPh = latestMeasurements['ph_measurement'] !== undefined ? 
    Number(latestMeasurements['ph_measurement']) : null;
  const currentEc = latestMeasurements['ec_measurement'] !== undefined ? 
    Number(latestMeasurements['ec_measurement']) / 1000 : null; // Convert µS/cm to mS/cm
  const currentPpm = latestMeasurements['tds_measurement'] !== undefined ? 
    Number(latestMeasurements['tds_measurement']) : null;
  
  const isPhOutOfRange = isParameterOutOfRange(paramData.ph_min, paramData.ph_max, currentPh);
  const isEcOutOfRange = isParameterOutOfRange(paramData.ec_min, paramData.ec_max, currentEc);
  const isPpmOutOfRange = isParameterOutOfRange(paramData.ppm_min, paramData.ppm_max, currentPpm);  // Don't render if we're still loading external data and it's an external plant
  if (externalId && loading) {
    return <div className="py-4 text-center text-gray-600 dark:text-gray-400">Loading plant information...</div>;
  }
  // Show error if present
  if (error) {
    return <div className="py-4 text-center text-red-600 dark:text-red-400">{error}</div>;
  }

  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    setIsEditing(false);
    setIsRefreshing(true);
    // Refresh the page to get updated data
    window.location.reload();
  };

  if (isEditing) {
    return (
      <EditableParameters 
        plantId={plantId}
        initialValues={paramData}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    );
  }  return (
    <div className="mt-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-2.5 h-auto flex flex-col">
      <div className="flex justify-between items-center mb-1.5">
        <h3 className="font-medium text-green-800 dark:text-green-300 text-xs flex items-center">
          Optimal Parameters
          {(isPhOutOfRange || isEcOutOfRange || isPpmOutOfRange) && (
            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-normal">
              (Out of range!)
            </span>
          )}
        </h3>
        <button 
          onClick={handleEdit}
          className="text-xs text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
        >
          Edit
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-xs"><div>
          <h4 className="font-medium text-gray-700 dark:text-gray-300 text-xs">pH</h4>
          <p className={isPhOutOfRange ? "text-red-600 dark:text-red-400 text-xs" : "text-gray-600 dark:text-gray-400 text-xs"}>
            {(paramData.ph_min === null && paramData.ph_max === null) ? (
              "N/A"
            ) : (
              <>                {paramData.ph_min !== null ? paramData.ph_min : '-'} - {paramData.ph_max !== null ? paramData.ph_max : '-'}
                {currentPh !== null && (
                  <span className="text-xs ml-1">
                    (Now: <span className={isPhOutOfRange ? "text-red-600 dark:text-red-400 font-bold" : ""}>{currentPh})</span>
                  </span>
                )}
              </>
            )}
          </p>
        </div>
          <div>
          <h4 className="font-medium text-gray-700 dark:text-gray-300 text-xs">EC</h4>
          <p className={isEcOutOfRange ? "text-red-600 dark:text-red-400 text-xs" : "text-gray-600 dark:text-gray-400 text-xs"}>
            {(paramData.ec_min === null && paramData.ec_max === null) ? (
              "N/A"
            ) : (
              <>                {paramData.ec_min !== null ? paramData.ec_min : '-'} - {paramData.ec_max !== null ? paramData.ec_max : '-'}
                {currentEc !== null && (
                  <span className="text-xs ml-1">
                    (Now: <span className={isEcOutOfRange ? "text-red-600 dark:text-red-400 font-bold" : ""}>{currentEc.toFixed(2)})</span>
                  </span>
                )}
              </>
            )}
          </p>
        </div>
          <div>
          <h4 className="font-medium text-gray-700 dark:text-gray-300 text-xs">PPM</h4>
          <p className={isPpmOutOfRange ? "text-red-600 dark:text-red-400 text-xs" : "text-gray-600 dark:text-gray-400 text-xs"}>
            {(paramData.ppm_min === null && paramData.ppm_max === null) ? (
              "N/A"
            ) : (
              <>                {paramData.ppm_min !== null ? paramData.ppm_min : '-'} - {paramData.ppm_max !== null ? paramData.ppm_max : '-'}
                {currentPpm !== null && (
                  <span className="text-xs ml-1">
                    (Now: <span className={isPpmOutOfRange ? "text-red-600 dark:text-red-400 font-bold" : ""}>{currentPpm})</span>
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
