'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthContext';

type Plant = {
  id: number;
  name: string;
  type: string;
  position: number | null;
  status: string;
  startDate: string;
  updatedAt: string;
  logs: Array<{
    id: number;
    status: string;
    note: string | null;
    photo: string | null;
    logDate: string;
  }>;
};

export default function PlantHistoryContent() {  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  // Use the auth context
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Group plants by date
  const groupedPlants: Record<string, Plant[]> = {};
  
  plants.forEach(plant => {
    const dateString = new Date(plant.updatedAt).toLocaleDateString();
    if (!groupedPlants[dateString]) {
      groupedPlants[dateString] = [];
    }
    groupedPlants[dateString].push(plant);
  });

  // Handle authentication errors explicitly
  useEffect(() => {
    if (!authLoading && !user) {
      // If not loading and no user, redirect to login
      console.warn('User not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [user, authLoading, router]);
    useEffect(() => {
    const fetchPlantHistory = async () => {
      try {
        // Only fetch data if the user is authenticated
        if (!user) {
          setLoading(false);
          setError('Authentication required');
          console.error('Attempted to fetch plant history without authentication');
          return;
        }
        
        console.log('Authenticated user fetching plant history:', user.id);
        
        const response = await fetch('/api/plants/history', {
          // Include credentials to ensure cookies are sent
          credentials: 'include',
          // Add a cache-busting parameter and auth header
          headers: {
            'x-timestamp': Date.now().toString(),
            'x-auth-check': 'true'
          }
        });
        
        if (response.status === 401) {
          setError('Authentication error: You must be logged in to view plant history');
          
          // Attempt to refresh auth state if we get a 401
          if (retryCount < 1) {
            setRetryCount(prev => prev + 1);
            // Short delay before retry
            setTimeout(() => {
              router.refresh();
            }, 1000);
          } else {
            // If multiple 401s, redirect to login
            router.push('/login');
          }
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to load plant history: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setPlants(data);
        // Reset retry count on success
        setRetryCount(0);
      } catch (err) {
        setError('Failed to load plant history');
        console.error('Error fetching plant history:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch history when auth loading is complete and user is authenticated
    if (!authLoading && user) {
      fetchPlantHistory();
    }
  }, [user, authLoading, retryCount, router]);
  
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading plant history...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Plant History</h1>
      
      <div className="space-y-6">
        {plants.length > 0 ? (
          Object.entries(groupedPlants).map(([date, plantsGroup]) => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
              <div className="bg-green-50 dark:bg-green-900/30 px-6 py-3 rounded-t-lg">
                <h2 className="text-lg font-semibold text-green-800 dark:text-green-300">{date}</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {plantsGroup.map((plant) => (
                  <div key={plant.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold dark:text-white">{plant.name}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {plant.type} • Previously in Position {plant.position || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                        <div>Started: {new Date(plant.startDate).toLocaleDateString()}</div>
                        <div>Removed: {new Date(plant.updatedAt).toLocaleTimeString()}</div>
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
                              {new Date(log.logDate).toLocaleTimeString()}
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
          ))
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            No removed plants in history yet.
          </p>
        )}
      </div>
    </div>
  );
}
