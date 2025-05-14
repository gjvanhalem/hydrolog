'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import ReportsClient from './page.client';

export type SystemLog = {
  id: number;
  type: string;
  value: number;
  unit: string;
  createdAt: string;
};

export type PlantLog = {
  id: number;
  plantId: number;
  status: string;
  createdAt: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [systemLogsResponse, plantsResponse] = await Promise.all([
          fetch('/api/system/logs'),
          fetch('/api/plants')
        ]);
        
        if (!systemLogsResponse.ok || !plantsResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const systemLogsData = await systemLogsResponse.json();
        const plantsData = await plantsResponse.json();
        
        setSystemLogs(systemLogsData);
        setPlants(plantsData);
      } catch (err) {
        setError('Error loading reports data');
        console.error('Error fetching reports data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <ProtectedRoute>
      {loading ? (
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reports...</p>
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
          <h1 className="text-3xl font-bold mb-6">Reports</h1>
          <ReportsClient systemLogs={systemLogs} plants={plants} />
        </div>
      )}
    </ProtectedRoute>
  );
}
