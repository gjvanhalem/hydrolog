'use client';

import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { format } from 'date-fns';

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
}

export default function SystemCharts({ systemLogs }: Props) {
  const [timeframe] = useState('week');

  const chartData = {
    ph: systemLogs
      .filter(log => log.type === 'ph_measurement')
      .map(log => ({
        x: format(new Date(log.createdAt), 'MM/dd/yyyy'),
        y: log.value
      })),
    ec: systemLogs
      .filter(log => log.type === 'ec_measurement')
      .map(log => ({
        x: format(new Date(log.createdAt), 'MM/dd/yyyy'),
        y: log.value
      })),
    tds: systemLogs
      .filter(log => log.type === 'tds_measurement')
      .map(log => ({
        x: format(new Date(log.createdAt), 'MM/dd/yyyy'),
        y: log.value
      })),
    temp: systemLogs
      .filter(log => log.type === 'temperature')
      .map(log => ({
        x: format(new Date(log.createdAt), 'MM/dd/yyyy'),
        y: log.value
      }))
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <>
      {/* pH Levels Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">pH Levels</h2>
        <Line
          data={{
            labels: chartData.ph.map(d => d.x),
            datasets: [
              {
                label: 'pH',
                data: chartData.ph.map(d => d.y),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
              }
            ]
          }}
          options={chartOptions}
        />
      </div>

      {/* EC Levels Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">EC Levels</h2>
        <Line
          data={{
            labels: chartData.ec.map(d => d.x),
            datasets: [
              {
                label: 'EC (µS/cm)',
                data: chartData.ec.map(d => d.y),
                borderColor: 'rgb(153, 102, 255)',
                tension: 0.1
              }
            ]
          }}
          options={chartOptions}
        />
      </div>

      {/* TDS Levels Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">TDS Levels</h2>
        <Line
          data={{
            labels: chartData.tds.map(d => d.x),
            datasets: [
              {
                label: 'TDS (ppm)',
                data: chartData.tds.map(d => d.y),
                borderColor: 'rgb(255, 159, 64)',
                tension: 0.1
              }
            ]
          }}
          options={chartOptions}
        />
      </div>

      {/* Temperature Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Temperature</h2>
        <Line
          data={{
            labels: chartData.temp.map(d => d.x),
            datasets: [
              {
                label: 'Temperature (°C)',
                data: chartData.temp.map(d => d.y),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
              }
            ]
          }}
          options={chartOptions}
        />
      </div>
    </>
  );
}
