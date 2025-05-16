'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import ReportsClient from './page.client';
import { useAuth } from '../components/AuthContext';

export type SystemLog = {
  id: number;
  type: string;
  value: number;
  unit: string;
  createdAt: string;
};

export type PlantLog = {
  id: number;
  status: string;
  note: string | null;
  photo: string | null;
  logDate: string;
};

export type Plant = {
  id: number;
  name: string;
  type: string;
  status: string;
  position: number | null;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  logs: PlantLog[];
};

export default function ReportsPage() {
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [removedPlants, setRemovedPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getActiveSystem } = useAuth();
  const activeSystem = getActiveSystem();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data for combined reports and history page');
          // Fetch system logs - filter by active system only
        const systemLogsResponse = await fetch('/api/system/logs?activeOnly=true');
        
        if (!systemLogsResponse.ok) {
          console.error('System logs fetch failed:', systemLogsResponse.status);
          throw new Error('Failed to fetch system logs');
        }
        
        const systemLogsData = await systemLogsResponse.json();
        console.log('System logs data:', systemLogsData.length, 'items loaded (filtered by active system)');
        
        // Fetch active plants
        const plantsResponse = await fetch('/api/plants');
        const plantsData = plantsResponse.ok ? await plantsResponse.json() : [];
        console.log('Active plants data:', plantsData.length, 'items loaded');          // Fetch plant history (removed plants)
        // The plants/history API now filters by active system
        const plantHistoryResponse = await fetch('/api/plants/history');
        
        let plantHistoryData: Plant[] = [];
        if (plantHistoryResponse.ok) {
          plantHistoryData = await plantHistoryResponse.json();
          console.log('Plant history data:', plantHistoryData.length, 'items loaded (filtered by active system)');
        } else if (plantHistoryResponse.status !== 404) {
          console.error('Plant history fetch failed:', plantHistoryResponse.status);
        }
        
        setSystemLogs(systemLogsData);
        setPlants(plantsData);
        setRemovedPlants(plantHistoryData);
      } catch (err) {
        setError('Error loading reports and history data');
        console.error('Error fetching reports and history data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeSystem]); // Add activeSystem as a dependency to trigger data refresh when it changes

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reports and history...</p>
          </div>
        </div>
      ) : error ? (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold dark:text-white">Reports &amp; History</h1>
            {loading && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-500 mr-2"></div>
                Refreshing data...
              </div>
            )}
          </div>
          <ReportsClient systemLogs={systemLogs} plants={plants} removedPlants={removedPlants} activeSystem={activeSystem} />
        </div>
      )}
    </ProtectedRoute>
  );
}
