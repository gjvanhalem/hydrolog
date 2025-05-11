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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  plants: Plant[];
}

const GROWTH_STAGES = {
  'germination': 1,
  'seedling': 2,
  'vegetative': 3,
  'flowering': 4,
  'fruiting': 5,
  'harvesting': 6,
  'ended': 7
} as const;

type GrowthStage = keyof typeof GROWTH_STAGES;

export default function PlantGrowthChart({ plants }: Props) {
  const [selectedPlantIds, setSelectedPlantIds] = useState<string[]>([]);

  const chartDatasets = selectedPlantIds
    .map(id => {
      const plant = plants.find(p => p.id === parseInt(id));
      if (!plant) return null;

      return {
        label: plant.name,
        data: plant.logs.map(log => ({
          x: format(new Date(log.createdAt), 'MM/dd/yyyy'),
          y: GROWTH_STAGES[log.status as GrowthStage] || 0
        })),
        borderColor: `hsl(${plant.id * 137.5 % 360}, 70%, 50%)`,
        tension: 0.1
      };
    })
    .filter((dataset): dataset is NonNullable<typeof dataset> => dataset !== null);

  return (
    <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Plant Growth Comparison</h2>
        <select
          multiple
          value={selectedPlantIds}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, option => option.value);
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

      {selectedPlantIds.length > 0 ? (
        <Line
          data={{ datasets: chartDatasets }}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const stageNumber = context.parsed.y;
                    const stageName = Object.entries(GROWTH_STAGES)
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
                    return Object.entries(GROWTH_STAGES)
                      .find(([_, v]) => v === value)?.[0] || '';
                  }
                }
              }
            }
          }}
        />
      ) : (
        <p className="text-center text-gray-500 py-8">
          Select plants from the dropdown above to compare their growth stages
        </p>
      )}
    </div>
  );
}
