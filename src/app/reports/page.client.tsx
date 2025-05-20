'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { format } from 'date-fns';
import ChartWrapper from '../components/ChartWrapper';
import LogEntry from './LogEntry';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SystemLog {
  id: number;
  type: string;
  value: number;
  unit: string;
  createdAt: string;
  note?: string | null;
  logDate?: string;
  systemName?: string | null;
}

interface PlantLog {
  id: number;
  status: string;
  note: string | null;
  photo: string | null;
  logDate: string;
}

interface Plant {
  id: number;
  name: string;
  type: string;
  position: number | null;
  status: string;
  startDate: string;
  updatedAt: string;
  logs: PlantLog[];
}

interface Props {
  systemLogs: SystemLog[];
  plants: Plant[];
  removedPlants: Plant[];
  activeSystem?: {
    id: number;
    systemId: number;
    isActive: boolean;
    system: {
      id: number;
      name: string;
    };
  };
}

type TimeFrame = 'week' | 'month' | 'year';
type ActiveTab = 'system-charts' | 'plant-history' | 'log-history';

// Chart options
const getChartOptions = (isDarkMode: boolean): ChartOptions<'line'> => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: isDarkMode ? '#e5e7eb' : '#1f2937',
        usePointStyle: true,
        padding: 15
      }
    },
    title: {
      display: true,
      text: 'System Measurements Over Time',
      color: isDarkMode ? '#e5e7eb' : '#1f2937',
      font: {
        size: 16
      }
    },
    tooltip: {
      enabled: true,
      mode: 'index' as const,
      intersect: false,
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      titleColor: isDarkMode ? '#fff' : '#000',
      bodyColor: isDarkMode ? '#e5e7eb' : '#1f2937',
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
      borderWidth: 1,
      padding: 10
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'
      },
      ticks: {
        color: isDarkMode ? '#e5e7eb' : '#1f2937',
        padding: 8
      }
    },
    x: {
      grid: {
        color: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'
      },
      ticks: {
        color: isDarkMode ? '#e5e7eb' : '#1f2937'
      }
    }
  }
});

export default function ReportsClient({ systemLogs, plants, removedPlants, activeSystem }: Props) {
  const [timeframe, setTimeframe] = useState<TimeFrame>('week');  
  // Check URL params for initial tab selection
  const initialTab = typeof window !== 'undefined' 
    ? window.location.search.includes('tab=plant-history') 
      ? 'plant-history'
      : window.location.search.includes('tab=log-history')
        ? 'log-history'
        : 'system-charts'
    : 'system-charts';
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const isDarkMode = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const chartOptions = getChartOptions(isDarkMode);
    // Effect to sync URL with active tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let url = '/reports';
      
      if (activeTab === 'plant-history') {
        url = '/reports?tab=plant-history';
      } else if (activeTab === 'log-history') {
        url = '/reports?tab=log-history';
      }
      
      if (window.location.href.split('?')[0] + (window.location.search || '') !== url) {
        window.history.replaceState({}, '', url);
      }
    }
  }, [activeTab]);

  // Filter logs based on timeframe
  const filterByTimeframe = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    
    switch (timeframe) {
      case 'week':
        return date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return date >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return date >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  };
  
  // Process data for system measurement charts
  const getSystemChartData = (type: string) => {
    try {
      const filteredLogs = systemLogs
        .filter(log => log.type === type && filterByTimeframe(log.createdAt))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (filteredLogs.length === 0) {
        return {
          labels: [],
          datasets: [{
            label: type.replace('_', ' ').toUpperCase(),
            data: [],
            borderColor: type === 'ph_measurement' ? 'rgb(75, 192, 192)' :
                      type === 'ec_measurement' ? 'rgb(153, 102, 255)' :
                      type === 'tds_measurement' ? 'rgb(255, 159, 64)' :
                      'rgb(54, 162, 235)',
            tension: 0.1,
            fill: false
          }]
        };
      }

      return {
        labels: filteredLogs.map(log => format(new Date(log.createdAt), 'MM/dd/yyyy')),
        datasets: [{
          label: type.replace('_', ' ').toUpperCase(),
          data: filteredLogs.map(log => log.value),
          borderColor: type === 'ph_measurement' ? 'rgb(75, 192, 192)' :
                    type === 'ec_measurement' ? 'rgb(153, 102, 255)' :
                    type === 'tds_measurement' ? 'rgb(255, 159, 64)' :
                    'rgb(54, 162, 235)',
          backgroundColor: type === 'ph_measurement' ? 'rgba(75, 192, 192, 0.2)' :
                    type === 'ec_measurement' ? 'rgba(153, 102, 255, 0.2)' :
                    type === 'tds_measurement' ? 'rgba(255, 159, 64, 0.2)' :
                    'rgba(54, 162, 235, 0.2)',
          borderWidth: 2,
          pointRadius: 3,
          tension: 0.1,
          fill: false
        }]
      };
    } catch (error) {
      console.error(`Error processing ${type} data:`, error);
      return { labels: [], datasets: [] };
    }
  };
  // Group removed plants by date for the history view
  const groupedPlants: Record<string, Plant[]> = {};
  
  removedPlants.forEach(plant => {
    const dateString = new Date(plant.updatedAt).toLocaleDateString();
    if (!groupedPlants[dateString]) {
      groupedPlants[dateString] = [];
    }
    groupedPlants[dateString].push(plant);
  });
  
  // Group system logs by date for the log history view
  const groupedSystemLogs: Record<string, SystemLog[]> = {};
  
  systemLogs.forEach(log => {
    const dateString = new Date(log.logDate || log.createdAt).toLocaleDateString();
    if (!groupedSystemLogs[dateString]) {
      groupedSystemLogs[dateString] = [];
    }
    groupedSystemLogs[dateString].push(log);
  });

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold dark:text-white">
          System Reports & History
          {activeSystem && (
            <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-2">
              ({activeSystem.system.name})
            </span>
          )}
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex rounded-md overflow-hidden">
            <button
              className={`px-4 py-2 ${
                activeTab === 'system-charts'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              onClick={() => setActiveTab('system-charts')}
            >
              System Charts
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 'log-history'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              onClick={() => setActiveTab('log-history')}
            >
              Log History
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 'plant-history'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              onClick={() => setActiveTab('plant-history')}
            >
              Plant History
            </button>
          </div>          
          {activeTab === 'system-charts' && (
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as TimeFrame)}
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          )}
          <a
            href="/system/record"
            className="inline-flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
          >
            Record New Measurement
          </a>
        </div>
      </div>      {activeTab === 'system-charts' ? (
        !activeSystem ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
            <p className="text-gray-600 dark:text-gray-400 text-center py-6">
              No active system selected. Please select a system to view reports.
            </p>
          </div>
        ) : systemLogs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
            <p className="text-gray-600 dark:text-gray-400 text-center py-6">
              No measurements recorded yet for {activeSystem.system.name}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* pH Levels Chart */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">pH Levels</h2>
              <div style={{ height: "300px" }}>
                <ChartWrapper data={getSystemChartData('ph_measurement')} options={chartOptions} />
              </div>
            </div>
            
            {/* EC Levels Chart */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">EC Levels</h2>
              <div style={{ height: "300px" }}>
                <ChartWrapper data={getSystemChartData('ec_measurement')} options={chartOptions} />
              </div>
            </div>
            
            {/* TDS Levels Chart */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">TDS Levels</h2>
              <div style={{ height: "300px" }}>
                <ChartWrapper data={getSystemChartData('tds_measurement')} options={chartOptions} />
              </div>
            </div>
            
            {/* Temperature Chart */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Temperature</h2>
              <div style={{ height: "300px" }}>
                <ChartWrapper data={getSystemChartData('temperature')} options={chartOptions} />
              </div>
            </div>
          </div>
        )
      ) : activeTab === 'log-history' ? (
        !activeSystem ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
            <p className="text-gray-600 dark:text-gray-400 text-center py-6">
              No active system selected. Please select a system to view log history.
            </p>
          </div>
        ) : Object.entries(groupedSystemLogs).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
            <p className="text-gray-600 dark:text-gray-400 text-center py-6">
              No log entries found for {activeSystem.system.name}.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing the most recent system log entries grouped by date
              </div>
            </div>
            
            {Object.entries(groupedSystemLogs).map(([date, logs]) => (
              <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
                <div className="bg-green-50 dark:bg-green-900/30 px-6 py-3 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-green-800 dark:text-green-300">{date}</h2>
                </div>
                <div className="p-6 divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <LogEntry
                      key={log.id}
                      id={log.id}
                      type={log.type}
                      value={log.value}
                      unit={log.unit}
                      note={log.note}
                      logDate={log.logDate || log.createdAt}
                      systemName={log.systemName}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        !activeSystem ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
            <p className="text-gray-600 dark:text-gray-400 text-center py-6">
              No active system selected. Please select a system to view plant history.
            </p>
          </div>
        ) : Object.entries(groupedPlants).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedPlants).map(([date, plantsGroup]) => (
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
                          </p>                        </div>
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
                                )}                              </div>
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
        ) : (          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              No plants removed yet from {activeSystem.system.name}.
            </p>
          </div>
        )
      )}
    </div>
  );
}