'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthContext';

type PlantLog = {
  id: number;
  status: string;
  note: string | null;
  photo: string | null;
  logDate: string;
};

type Plant = {
  id: number;
  name: string;
  type: string;
  position: number | null;
  status: string;
  startDate: string;
  updatedAt: string;
  logs: PlantLog[];
};

interface PlantHistoryProps {
  systemId?: number;
}

export default function PlantHistory({ systemId }: PlantHistoryProps) {
  const [removedPlants, setRemovedPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getActiveSystem } = useAuth();
  const activeSystem = getActiveSystem();

  // Group plants by date for display
  const groupedPlants: Record<string, Plant[]> = {};
  
  removedPlants.forEach(plant => {
    const dateString = new Date(plant.updatedAt).toLocaleDateString();
    if (!groupedPlants[dateString]) {
      groupedPlants[dateString] = [];
    }
    groupedPlants[dateString].push(plant);
  });

  useEffect(() => {
    const fetchPlantHistory = async () => {
      try {
        setLoading(true);
        
        // Use either provided systemId or get from active system
        const activeSystemId = systemId || activeSystem?.systemId;
        
        if (!activeSystemId) {
          setError('No system selected');
          setLoading(false);
          return;
        }

        // Fetch plant history for this specific system
        const response = await fetch(`/api/plants/history?systemId=${activeSystemId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch plant history');
        }
        
        const data = await response.json();
        setRemovedPlants(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching plant history:', error);
        setError('Failed to load plant history');
      } finally {
        setLoading(false);
      }
    };

    fetchPlantHistory();
  }, [systemId, activeSystem]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        <p className="ml-3 text-gray-600 dark:text-gray-400">Loading plant history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-md p-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Plant History</h2>
      
      {Object.entries(groupedPlants).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedPlants).map(([date, plantsGroup]) => (
            <div key={date} className="bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="bg-green-50 dark:bg-green-900/30 px-4 py-2 rounded-t-lg">
                <h3 className="text-md font-semibold text-green-800 dark:text-green-300">{date}</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {plantsGroup.map((plant) => (
                  <div key={plant.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-medium dark:text-white">{plant.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {plant.type} • Previously in Position {plant.position || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                        <div>Started: {new Date(plant.startDate).toLocaleDateString()}</div>
                        <div>Removed: {new Date(plant.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Growth Timeline */}
                    <div className="mt-3 space-y-3">
                      {plant.logs.map((log) => (
                        <div key={log.id} className="border-l-2 border-green-500 pl-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium dark:text-gray-100">
                                {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                              </span>
                              {log.note && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {log.note}
                                </p>
                              )}
                            </div>
                            <time className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(log.logDate).toLocaleDateString()}
                            </time>
                          </div>
                          {log.photo && (
                            <img
                              src={log.photo}
                              alt={`Growth stage: ${log.status}`}
                              className="mt-2 rounded-lg max-h-36 object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-400 py-6">
          No plant history available for this system.
        </p>
      )}
    </div>
  );
}
