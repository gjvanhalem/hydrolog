import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import LogEntry from './LogEntry';
import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'System Log History | HydroLog',
  description: 'View complete log history of your hydroponic system measurements'
};

export default async function DailyLogPage() {
  // Check if the user is authenticated
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
    return null;
  }

  // Get all logs in descending order by date, filtered by userId
  const allLogs = await prisma.systemLog.findMany({
    where: {
      // Only fetch logs for the current user
      userId: userId
    },
    orderBy: {
      logDate: 'desc'
    },
    take: 100 // Limit to the most recent 100 logs for performance
  });
  
  // Group logs by date for better organization
  const groupedLogs: Record<string, typeof allLogs> = {};
  
  allLogs.forEach(log => {
    const dateString = new Date(log.logDate).toLocaleDateString();
    if (!groupedLogs[dateString]) {
      groupedLogs[dateString] = [];
    }
    groupedLogs[dateString].push(log);
  });

  return (
    <div className="p-6">      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold dark:text-white">System Log History</h1>
          <a
            href="/system/record"
            className="inline-flex items-center px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
          >
            Record New Measurement
          </a>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Showing the most recent 100 entries grouped by date
        </div>
      </div><div className="space-y-6">
        {allLogs.length > 0 ? (
          Object.entries(groupedLogs).map(([date, logs]) => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50">
              <div className="bg-green-50 dark:bg-green-900/30 px-6 py-3 rounded-t-lg">
                <h2 className="text-lg font-semibold text-green-800 dark:text-green-300">{date}</h2>
              </div>
              <div className="p-6 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
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
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
              No measurements recorded yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
