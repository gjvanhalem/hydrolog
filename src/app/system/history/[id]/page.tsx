'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthContext';
import Link from 'next/link';

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

export default function SystemPlantHistoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const systemId = parseInt(params.id);
  const [removedPlants, setRemovedPlants] = useState<Plant[]>([]);
  const [systemName, setSystemName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const fetchSystemInfo = async () => {
      try {
        // Fetch system name
        const systemResponse = await fetch(`/api/system?systemId=${systemId}`);
        if (systemResponse.ok) {
          const systemData = await systemResponse.json();
          setSystemName(systemData.name || `System ${systemId}`);
        }
      } catch (error) {
        console.error('Error fetching system info:', error);
        setSystemName(`System ${systemId}`);
      }
    };

    const fetchPlantHistory = async () => {
      try {
        setLoading(true);
        
        // Fetch plant history for this specific system
        const response = await fetch(`/api/plants/history?systemId=${systemId}`);
        
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

    fetchSystemInfo();
    fetchPlantHistory();
  }, [systemId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold dark:text-white">
            Plant History
          </h1>
          <Link
            href="/system/manage"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </Link>
        </div>
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
          <p className="ml-4 text-gray-600 dark:text-gray-400">Loading plant history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold dark:text-white">
            Plant History
          </h1>
          <Link
            href="/system/manage"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </Link>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white">
          Plant History: <span className="text-green-600 dark:text-green-400">{systemName}</span>
        </h1>
        <Link
          href="/system/manage"
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
      </div>
      
      {Object.entries(groupedPlants).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedPlants).map(([date, plantsGroup]) => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
              <div className="bg-green-50 dark:bg-green-900/30 px-6 py-3 rounded-t-lg">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">{date}</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {plantsGroup.map((plant) => (
                  <div key={plant.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold dark:text-white">{plant.name}</h3>
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
                    <div className="mt-4 space-y-3">
                      {plant.logs.map((log) => (
                        <div key={log.id} className="border-l-2 border-green-500 pl-4">
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
                              className="mt-2 rounded-lg max-h-48 object-cover"
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            No plant history available for this system.
          </p>
        </div>
      )}
    </div>
  );
}
