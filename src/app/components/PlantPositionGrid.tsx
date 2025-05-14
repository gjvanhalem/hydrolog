'use client';

import Link from 'next/link';
import { Plant } from '@prisma/client';

interface Position {
  position: number;
  plant?: Plant | null;
}

interface PlantPositionGridProps {
  plants: Plant[];
  positionsPerRow: number[]; // Add positionsPerRow prop
  highlightPosition?: number | null;
  className?: string;
}

export default function PlantPositionGrid({ plants, positionsPerRow, highlightPosition, className = '' }: PlantPositionGridProps) {
  const activePlants = plants.filter(p => p.status !== 'removed');

  // Generate rows dynamically based on positionsPerRow
  const rows = positionsPerRow.map((positions, rowIndex) =>
    Array.from({ length: positions }, (_, i) => ({
      position: i + 1 + positionsPerRow.slice(0, rowIndex).reduce((a, b) => a + b, 0),
      plant: activePlants.find(p => p.position === i + 1 + positionsPerRow.slice(0, rowIndex).reduce((a, b) => a + b, 0))
    }))
  );

  const PositionCell = ({ position, plant }: Position) => (
    <div
      key={position}
      aria-label={`Position ${position}`}
      className={`
        w-24 h-24 rounded-lg p-4 flex flex-col justify-center items-center
        ${plant 
          ? 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/50' 
          : 'bg-gray-100 dark:bg-gray-700/50'
        }
        ${position === highlightPosition 
          ? 'ring-2 ring-green-500 dark:ring-green-400' 
          : ''
        }
        transition-colors
      `}
    >
      <div className="text-lg font-semibold mb-1 dark:text-gray-100">P{position}</div>
      {plant ? (
        <Link 
          href={`/plants/${plant.id}`}
          className="text-center"
        >
          <div className="font-medium text-green-800 dark:text-green-300 text-sm">{plant.name}</div>
          <div className="text-xs text-green-600 dark:text-green-400">{plant.type}</div>
          <div className="text-xs text-green-500 dark:text-green-500">{plant.status}</div>
        </Link>
      ) : (
        <Link 
          href={`/plants/new?position=${position}`}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-center"
        >
          Available
        </Link>
      )}
    </div>
  );

  return (
    <div className={`flex flex-col gap-8 ${className}`}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-4">
          {row.map((pos) => (
            <PositionCell key={pos.position} {...pos} />
          ))}
        </div>
      ))}
    </div>
  );
}
