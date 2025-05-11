import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import PlantPositionGrid from '@/app/components/PlantPositionGrid';

export default async function PlantsPage() {
  const plants = await prisma.plant.findMany({
    where: {
      status: { not: 'removed' }
    },
    orderBy: [
      {
        position: 'asc'
      }
    ],
    include: {
      logs: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    }
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white">Plants</h1>
        <Link href="/plants/new">
          <button className="bg-green-600 dark:bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors">
            Add New Plant
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Position Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">System Layout</h2>
          <PlantPositionGrid plants={plants} />
        </div>

        {/* Plant Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{plants.length}</div>
              <div className="text-sm text-green-600 dark:text-green-500">Active Plants</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{12 - plants.length}</div>
              <div className="text-sm text-blue-600 dark:text-blue-500">Available Slots</div>
            </div>
          </div>
        </div>
      </div>

      {/* Plant Cards */}
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
