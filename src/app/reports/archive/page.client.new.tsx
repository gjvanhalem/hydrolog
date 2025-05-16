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
  Legend,
  ChartData,
  ChartOptions
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

interface PlantLog {
  id: number;
  plantId: number;
  status: string;
  createdAt: string;
}

interface Plant {
  id: number;
  name: string;
  type: string;
  logs: PlantLog[];
}

interface Props {
  systemLogs: SystemLog[];
  plants: Plant[];
}

type TimeFrame = 'week' | 'month' | 'year';
type GrowthStage = 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvesting' | 'ended';

const growthStages: Record<GrowthStage, number> = {
  'germination': 1,
  'seedling': 2,
  'vegetative': 3,
  'flowering': 4,
  'fruiting': 5,
  'harvesting': 6,
  'ended': 7
};

// Chart options
const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'System Measurements Over Time'
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

export default function ReportsClient({ systemLogs, plants }: Props) {
  const [timeframe, setTimeframe] = useState<TimeFrame>('week');
  const [selectedPlantIds, setSelectedPlantIds] = useState<number[]>([]);

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
    const filteredLogs = systemLogs
      .filter(log => log.type === type && filterByTimeframe(log.createdAt))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return {
      labels: filteredLogs.map(log => format(new Date(log.createdAt), 'MM/dd/yyyy')),
      datasets: [{
        label: type.replace('_', ' ').toUpperCase(),
        data: filteredLogs.map(log => log.value),
        borderColor: type === 'ph_measurement' ? 'rgb(75, 192, 192)' :
                    type === 'ec_measurement' ? 'rgb(153, 102, 255)' :
                    type === 'tds_measurement' ? 'rgb(255, 159, 64)' :
                    'rgb(54, 162, 235)',
        tension: 0.1,
        fill: false
      }]
    };
  };

  // Process plant growth data
  const getPlantGrowthData = () => {
    return {
      datasets: selectedPlantIds.map(plantId => {
        const plant = plants.find(p => p.id === plantId);
        if (!plant) return null;

        const filteredLogs = plant.logs
          .filter(log => filterByTimeframe(log.createdAt))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        return {
          label: plant.name,
          data: filteredLogs.map(log => ({
            x: format(new Date(log.createdAt), 'MM/dd/yyyy'),
            y: growthStages[log.status as GrowthStage] || 0
          })),
          borderColor: `hsl(${plant.id * 137.5 % 360}, 70%, 50%)`,
          tension: 0.1,
          fill: false
        };
      }).filter((dataset): dataset is NonNullable<typeof dataset> => dataset !== null)
    };
  };

  // Plant growth chart options
  const plantGrowthChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const stageNumber = context.parsed.y;
            const stageName = Object.entries(growthStages)
              .find(([_, value]) => value === stageNumber)?.[0];
            return `${context.dataset.label}: ${stageName}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => {
            return Object.entries(growthStages)
              .find(([_, v]) => v === value)?.[0] || '';
          }
        }
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Reports</h1>
        <div className="flex gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as TimeFrame)}
            className="p-2 border rounded"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <select
            multiple
            value={selectedPlantIds.map(String)}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
              setSelectedPlantIds(values);
            }}
            className="p-2 border rounded"
            size={3}
          >
            {plants.map(plant => (
              <option key={plant.id} value={plant.id}>
                {plant.name} ({plant.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* pH Levels Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">pH Levels</h2>
          <Line data={getSystemChartData('ph_measurement')} options={chartOptions} />
        </div>

        {/* EC Levels Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">EC Levels</h2>
          <Line data={getSystemChartData('ec_measurement')} options={chartOptions} />
        </div>

        {/* TDS Levels Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">TDS Levels</h2>
          <Line data={getSystemChartData('tds_measurement')} options={chartOptions} />
        </div>

        {/* Temperature Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Temperature</h2>
          <Line data={getSystemChartData('temperature')} options={chartOptions} />
        </div>

        {/* Plant Growth Comparison Chart - Full Width */}
        <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Plant Growth Comparison</h2>
          {selectedPlantIds.length > 0 ? (
            <Line data={getPlantGrowthData()} options={plantGrowthChartOptions} />
          ) : (
            <p className="text-center text-gray-500 py-8">
              Select plants from the dropdown above to compare their growth stages
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
