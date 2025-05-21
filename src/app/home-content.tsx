'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./components/AuthContext";
import PlantPositionGrid from "./components/PlantPositionGrid";
import FloatingAdvisor from "./components/FloatingAdvisor";

type SystemLog = {
  id: number;
  type: string;
  value: number;
  unit: string;
  note?: string | null;
  logDate: string;
};

type Plant = {
  id: number;
  name: string;
  type: string;
  position: number | null;
  status: string;
  startDate: string;
  systemId?: number; 
  userId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  ph_min?: number | null;
  ph_max?: number | null;
  ec_min?: number | null;
  ec_max?: number | null;
  ppm_min?: number | null;
  ppm_max?: number | null;
  external_id?: number | null;
  hasOutOfRangeParams?: boolean;
};

export default function HomeContent() {
  const { user, isLoading, getActiveSystem } = useAuth();
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [positionsPerRow, setPositionsPerRow] = useState<number[]>([]); // Add state for positions per row
  const [loading, setLoading] = useState(true);
  const activeSystem = getActiveSystem();
    useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
        try {
        // Fetch system logs - filtered by active system only
        const logsResponse = await fetch('/api/system/logs?activeOnly=true');
        const systemResponse = await fetch('/api/system'); // Fetch system data for grid layout
        
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          
          // Group logs by type, keeping only the latest
          const logsByType: Record<string, SystemLog> = {};
          logsData.forEach((log: SystemLog) => {
            if (!logsByType[log.type] || new Date(log.logDate) > new Date(logsByType[log.type].logDate)) {
              logsByType[log.type] = log;
            }
          });
          
          setSystemLogs(Object.values(logsByType));
          
          // Get current measurement values for checking parameters
          const currentPh = logsByType['ph_measurement'] ? Number(logsByType['ph_measurement'].value) : null;
          const currentEc = logsByType['ec_measurement'] ? Number(logsByType['ec_measurement'].value) / 1000 : null; // Convert µS/cm to mS/cm
          const currentPpm = logsByType['tds_measurement'] ? Number(logsByType['tds_measurement'].value) : null;
          
          // Fetch plants
          const plantsResponse = await fetch('/api/plants');
          
          if (plantsResponse.ok) {
            const plantsData = await plantsResponse.json();
            
            // Add flag to plants with out-of-range parameters
            const processedPlants = plantsData.map((plant: Plant) => {
              const isPhOutOfRange = isParameterOutOfRange(plant.ph_min, plant.ph_max, currentPh);
              const isEcOutOfRange = isParameterOutOfRange(plant.ec_min, plant.ec_max, currentEc);
              const isPpmOutOfRange = isParameterOutOfRange(plant.ppm_min, plant.ppm_max, currentPpm);
              
              return {
                ...plant,
                hasOutOfRangeParams: isPhOutOfRange || isEcOutOfRange || isPpmOutOfRange
              };
            });
            
            setPlants(processedPlants);
          }
          
          // Set positions per row from system data
          if (systemResponse.ok) {
            const systemData = await systemResponse.json();
            setPositionsPerRow(systemData.positionsPerRow || []);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, activeSystem]); // Add activeSystem as a dependency to trigger data refresh when it changes
  
  // Function to check if a parameter is out of range
  const isParameterOutOfRange = (minValue: number | null | undefined, maxValue: number | null | undefined, currentValue: number | null): boolean => {
    if (currentValue === null) return false;
    if (!minValue && !maxValue) return false;
    
    const min = minValue !== null && minValue !== undefined ? Number(minValue) : Number.MIN_SAFE_INTEGER;
    const max = maxValue !== null && maxValue !== undefined ? Number(maxValue) : Number.MAX_SAFE_INTEGER;
    const current = Number(currentValue);
    
    return current < min || current > max;
  };
  
  // If not authenticated, show welcome screen
  if (!isLoading && !user) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Welcome to HydroLog</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Get Started</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              HydroLog helps you monitor and manage your hydroponic garden. Log in or sign up to:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 mb-6">
              <li>Track plant growth</li>
              <li>Monitor water conditions</li>
              <li>Log system measurements</li>
              <li>Visualize your data</li>
            </ul>
            <div className="flex flex-col space-y-4">
              <Link href="/login">
                <button className="w-full bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors">
                  Login
                </button>
              </Link>
              <Link href="/signup">
                <button className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">About HydroLog</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              HydroLog is a comprehensive management system for home hydroponic gardens that helps you:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
              <li>Track plant positions, growth stages, and health</li>
              <li>Monitor key water parameters like pH, EC, TDS, and temperature</li>
              <li>View historical data and trends for system performance</li>
              <li>Organize plant life cycles from planting to harvesting</li>
              <li>Keep detailed logs of all your gardening activities</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
    if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Convert plant data to match PlantPositionGrid's expected type
  const convertedPlants = plants.map(plant => ({
    ...plant,
    startDate: new Date(plant.startDate),
    createdAt: plant.createdAt || new Date(),
    updatedAt: plant.updatedAt || new Date(),
    systemId: plant.systemId || 0,
    userId: plant.userId || 0
  }));  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">
        Hydroponics Dashboard
        {loading && (
          <span className="ml-3 inline-block align-middle">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-500"></div>
          </span>
        )}
      </h1>
      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl w-full justify-center items-start">
        {/* Left Column - Plant Grid - Self-sizing card */}
        <div className="inline-block mx-auto lg:mx-0">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Active Plants</h2>
              <Link href="/plants/new" className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Plant
              </Link>
            </div>
            <PlantPositionGrid 
              plants={convertedPlants} 
              positionsPerRow={positionsPerRow} 
              className="mt-4" 
            />
            {plants.length === 0 && (
              <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
                No plants yet. Add your first plant!
              </p>
            )}
          </div>
        </div>
        
        {/* Right Column - System Status and Quick Actions (stacked) - Fixed width */}
        <div className="space-y-6 mx-auto lg:mx-0 w-full lg:w-96">
          {/* System Status Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">
              System Status
              {activeSystem && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                  ({activeSystem.system.name})
                </span>
              )}
            </h2>
            <div className="space-y-4">
              {!activeSystem ? (
                <p className="text-gray-600 dark:text-gray-400">No active system selected.</p>
              ) : systemLogs.length > 0 ? (
                systemLogs.map(log => (
                  <div key={log.id} className="dark:text-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {log.type.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}:
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {log.value} {log.unit}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Last updated: {new Date(log.logDate).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No measurements recorded yet.</p>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/plants/new" className="block">
                <button className="w-full bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors">
                  Add New Plant
                </button>
              </Link>
              <Link href="/system/record" className="block">
                <button className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                  Log System Status
                </button>
              </Link>              <Link href="/reports" className="block">
                <button className="w-full bg-purple-600 dark:bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors">
                  View Reports
                </button>
              </Link>
            </div>
          </div>        </div>
      </div>
    </div>
  );
}
