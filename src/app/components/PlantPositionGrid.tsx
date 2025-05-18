'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toNumber } from '@/lib/decimal-utils';

// Define SystemLog type for the measurements
interface SystemLog {
  id: number;
  type: string;
  value: number;
  unit: string;
  logDate: string;
}

// Define a custom Plant interface with the parameter fields
interface PlantWithParameters {
  id: number;
  name: string;
  type: string;
  position: number | null;
  status: string;
  startDate: Date;
  systemId: number; 
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  ph_min?: number | null;
  ph_max?: number | null;
  ec_min?: number | null;
  ec_max?: number | null;
  ppm_min?: number | null;
  ppm_max?: number | null;
  external_id?: number | null;
}

interface Position {
  position: number;
  plant?: PlantWithParameters | null;
}

interface PlantPositionGridProps {
  plants: PlantWithParameters[];
  positionsPerRow: number[];
  highlightPosition?: number | null;
  className?: string;
}

export default function PlantPositionGrid({ plants, positionsPerRow, highlightPosition, className = '' }: PlantPositionGridProps) {
  const activePlants = plants.filter(p => p.status !== 'removed');
  const [latestMeasurements, setLatestMeasurements] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the latest system measurements
  useEffect(() => {
    const fetchLatestMeasurements = async () => {
      try {
        setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLatestMeasurements();
  }, []);    // Check if plant parameters are within range  
  const isPlantInDanger = (plant: PlantWithParameters) => {
    // Convert values to numbers (not null or undefined) for easier comparison
    const ph_min = plant.ph_min !== null && plant.ph_min !== undefined ? Number(plant.ph_min) : undefined;
    const ph_max = plant.ph_max !== null && plant.ph_max !== undefined ? Number(plant.ph_max) : undefined;
    const ec_min = plant.ec_min !== null && plant.ec_min !== undefined ? Number(plant.ec_min) : undefined;
    const ec_max = plant.ec_max !== null && plant.ec_max !== undefined ? Number(plant.ec_max) : undefined;
    const ppm_min = plant.ppm_min !== null && plant.ppm_min !== undefined ? Number(plant.ppm_min) : undefined;
    const ppm_max = plant.ppm_max !== null && plant.ppm_max !== undefined ? Number(plant.ppm_max) : undefined;
      
    const currentPh = latestMeasurements['ph_measurement'] !== undefined ? 
      Number(latestMeasurements['ph_measurement']) : undefined;
    const currentEc = latestMeasurements['ec_measurement'] !== undefined ? 
      Number(latestMeasurements['ec_measurement']) / 1000 : undefined; // Convert µS/cm to mS/cm
    const currentPpm = latestMeasurements['tds_measurement'] !== undefined ? 
      Number(latestMeasurements['tds_measurement']) : undefined;

    // Only check parameters if both the plant has defined ranges and we have measurements
    if (currentPh !== undefined && (ph_min !== undefined || ph_max !== undefined)) {
      if ((ph_min !== undefined && currentPh < ph_min) || 
          (ph_max !== undefined && currentPh > ph_max)) {
        return true;
      }
    }
      if (currentEc !== undefined && (ec_min !== undefined || ec_max !== undefined)) {
      // currentEc is now in mS/cm after conversion from µS/cm (divided by 1000)
      if ((ec_min !== undefined && currentEc < ec_min) || 
          (ec_max !== undefined && currentEc > ec_max)) {
        
        return true;
      }
    }
    
    if (currentPpm !== undefined && (ppm_min !== undefined || ppm_max !== undefined)) {
      if ((ppm_min !== undefined && currentPpm < ppm_min) || 
          (ppm_max !== undefined && currentPpm > ppm_max)) {
        
        return true;      }
    }
    
    return false;
  };

  // Generate rows dynamically based on positionsPerRow
  const rows = positionsPerRow.map((positions, rowIndex) =>
    Array.from({ length: positions }, (_, i) => ({
      position: i + 1 + positionsPerRow.slice(0, rowIndex).reduce((a, b) => a + b, 0),
      plant: activePlants.find(p => p.position === i + 1 + positionsPerRow.slice(0, rowIndex).reduce((a, b) => a + b, 0))
    }))
  );

  const PositionCell = ({ position, plant }: Position) => {
    // Check if the plant is in danger (parameters outside of acceptable range)
    const inDanger = plant ? isPlantInDanger(plant) : false;
    
    return (
      <div
        key={position}
        aria-label={`Position ${position}`}
        className={`
          w-24 h-24 rounded-lg p-4 flex flex-col justify-center items-center
          ${plant 
            ? inDanger 
              ? 'bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50' 
              : 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/50'
            : 'bg-gray-100 dark:bg-gray-700/50'
          }
          ${position === highlightPosition 
            ? 'ring-2 ring-green-500 dark:ring-green-400' 
            : ''
          }
          transition-colors
        `}
      >
        <div className="text-lg font-semibold mb-1 dark:text-gray-100">P{position}</div>
        {plant ? (
          <Link 
            href={`/plants/${plant.id}`}
            className="text-center"
          >
            <div className={`font-medium text-sm ${inDanger ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300'}`}>
              {plant.name}
            </div>
            <div className={`text-xs ${inDanger ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {plant.type}
            </div>
            <div className={`text-xs ${inDanger ? 'text-red-500 dark:text-red-500' : 'text-green-500 dark:text-green-500'}`}>
              {plant.status}
            </div>
          </Link>
        ) : (
          <Link 
            href={`/plants/new?position=${position}`}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-center"
          >
            Available
          </Link>
        )}
      </div>
    );
  };  return (
    <div className={`flex flex-col gap-8 ${className}`}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-4">
          {row.map((pos) => (
            <PositionCell key={pos.position} {...pos} />
          ))}
        </div>
      ))}
    </div>
  );
}
