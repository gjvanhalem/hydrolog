'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PlantPositionGrid from '@/app/components/PlantPositionGrid';
import RemoveAllPlantsButton from '@/app/components/RemoveAllPlantsButton';

type Plant = {
  id: number;
  name: string;
  type: string;
  position: number | null;
  status: string;
  startDate: Date;
  systemId: number; // Add systemId field
  userId: number;
  createdAt: Date;
  updatedAt: Date;
};

type System = {
  positionsPerRow: number[];
};

export default function PlantsContent() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [positionsPerRow, setPositionsPerRow] = useState<number[]>([]); // Add state for positionsPerRow
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plantsResponse, systemResponse] = await Promise.all([
          fetch('/api/plants'),
          fetch('/api/system') // Fetch system data
        ]);

        if (!plantsResponse.ok || !systemResponse.ok) {
          throw new Error('Failed to load data');
        }

        const plantsData = await plantsResponse.json();
        const systemData: System = await systemResponse.json();

        setPlants(plantsData);
        setPositionsPerRow(systemData.positionsPerRow); // Set positionsPerRow
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading plants...</p>
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white">Plants</h1>
        <div className="flex gap-4">
          {plants.length > 0 && <RemoveAllPlantsButton />}
          <Link href="/plants/new">
            <button className="bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors">
              Add New Plant
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">System Layout</h2>
          <PlantPositionGrid plants={plants} positionsPerRow={positionsPerRow} /> {/* Pass positionsPerRow */}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{plants.length}</div>
              <div className="text-sm text-green-600 dark:text-green-500">Active Plants</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{positionsPerRow.reduce((a, b) => a + b, 0) - plants.length}</div>
              <div className="text-sm text-blue-600 dark:text-blue-500">Available Slots</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plants.map((plant) => (
          <div key={plant.id} className="group bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6 transition-all hover:shadow-xl dark:hover:shadow-gray-900/80">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {plant.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Position {plant.position}</p>
              </div>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                {plant.status}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Type: {plant.type}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Started: {new Date(plant.startDate).toLocaleDateString()}
              </p>
            </div>

            <Link href={`/plants/${plant.id}`}>
              <button className="w-full bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors">
                View Details
              </button>
            </Link>
          </div>
        ))}
        {plants.length === 0 && (
          <div className="lg:col-span-3 text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
            <p className="text-gray-600 dark:text-gray-400">No plants yet. Add your first plant to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
