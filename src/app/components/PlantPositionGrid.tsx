'use client';

import Link from 'next/link';
import { Plant } from '@prisma/client';

interface Position {
  position: number;
  plant?: Plant | null;
}

interface PlantPositionGridProps {
  plants: Plant[];
  highlightPosition?: number | null;
  className?: string;
}

export default function PlantPositionGrid({ plants, highlightPosition, className = '' }: PlantPositionGridProps) {  // Filter out removed plants and create positions array
  const activePlants = plants.filter(p => p.status !== 'removed');
  // Active plants are filtered for display
  
  // Define the positions based on the 4-5-3 layout
  const rows = [
    // First row: 4 positions
    Array.from({ length: 4 }, (_, i) => ({
      position: i + 1,
      plant: activePlants.find(p => p.position === i + 1)
    })),
    // Second row: 5 positions
    Array.from({ length: 5 }, (_, i) => ({
      position: i + 5,
      plant: activePlants.find(p => p.position === i + 5)
    })),
    // Third row: 3 positions
    Array.from({ length: 3 }, (_, i) => ({
      position: i + 10,
      plant: activePlants.find(p => p.position === i + 10)
    }))
  ];

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
      {/* Row 1: 4 positions */}
      <div className="flex justify-center gap-4">
        {rows[0].map((pos) => (
          <PositionCell key={pos.position} {...pos} />
        ))}
      </div>
      
      {/* Row 2: 5 positions */}
      <div className="flex justify-center gap-4">
        {rows[1].map((pos) => (
          <PositionCell key={pos.position} {...pos} />
        ))}
      </div>
      
      {/* Row 3: 3 positions */}
      <div className="flex justify-center gap-4">
        {rows[2].map((pos) => (
          <PositionCell key={pos.position} {...pos} />
        ))}
      </div>
    </div>
  );
}
