import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  // Fetch the latest system logs
  const latestSystemLogs = await prisma.systemLog.findMany({
    take: 1,
    orderBy: {
      createdAt: 'desc'
    },
    distinct: ['type']
  });

  // Fetch active plants
  const plants = await prisma.plant.findMany({
    orderBy: {
      position: 'asc'
    }
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Hydroponics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* System Status Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">System Status</h2>
          <div className="space-y-2">
            {latestSystemLogs.map(log => (
              <div key={log.id} className="flex justify-between dark:text-gray-300">
                <span>{log.type}:</span>
                <span className="font-medium">{log.value} {log.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Plants Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Active Plants</h2>
          <div className="space-y-2">
            {plants.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No plants yet. Add your first plant!</p>
            ) : (
              plants.map(plant => (
                <div key={plant.id} className="flex justify-between items-center dark:text-gray-300">
                  <span>{plant.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Position {plant.position}</span>
                </div>
              ))
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
            </Link>
            <Link href="/reports" className="block">
              <button className="w-full bg-purple-600 dark:bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors">
                View Reports
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
