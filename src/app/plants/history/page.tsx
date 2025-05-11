import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Plant History | HydroLog',
  description: 'Historical overview of all plants in your hydroponic system'
};

export default async function HistoryPage() {
  const plants = await prisma.plant.findMany({
    where: {
      status: 'removed'
    },
    include: {
      logs: {
        orderBy: {
          logDate: 'desc'
        },
        select: {
          id: true,
          status: true,
          note: true,
          photo: true,
          logDate: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Plant History</h1>
      
      <div className="space-y-6">
        {plants.map((plant) => (
          <div 
            key={plant.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold dark:text-white">{plant.name}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {plant.type} • Previously in Position {plant.position || 'Unknown'}
                </p>
              </div>
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
                      )}
                    </div>
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
        {plants.length === 0 && (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            No removed plants in history yet.
          </p>
        )}
      </div>
    </div>
  );
}
