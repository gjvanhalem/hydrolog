import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import LogEntry from './LogEntry';

export const metadata: Metadata = {
  title: 'Daily System Log | HydroLog',
  description: 'View and record daily system measurements for your hydroponic system'
};

export default async function DailyLogPage() {
  // Get today's logs
  const todaysLogs = await prisma.systemLog.findMany({
    where: {
      logDate: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    },
    orderBy: {
      logDate: 'desc'
    }
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white">Daily System Log</h1>
        <a
          href="/system/record"
          className="inline-flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
        >
          Record New Measurement
        </a>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
        {todaysLogs.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {todaysLogs.map((log) => (
              <LogEntry
                key={log.id}
                id={log.id}
                type={log.type}
                value={log.value}
                unit={log.unit}
                note={log.note}
                logDate={log.logDate}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">
            No measurements recorded today.
          </p>
        )}
      </div>
    </div>
  );
}
