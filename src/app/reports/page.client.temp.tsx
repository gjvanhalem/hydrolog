'use client';

import React, { useState } from 'react';
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
}

interface Props {
  systemLogs: SystemLog[];
  plants: any[]; // Keep the plants prop for compatibility with the page wrapper
}

type TimeFrame = 'week' | 'month' | 'year';

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

export default function ReportsClient({ systemLogs }: Props) {
  const [timeframe, setTimeframe] = useState<TimeFrame>('week');
  const isDarkMode = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const chartOptions = getChartOptions(isDarkMode);

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white">System Reports</h1>
        <div className="flex gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as TimeFrame)}
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

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
    </div>
  );
}
