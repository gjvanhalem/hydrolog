'use client';

import React, { useEffect, useState } from 'react';

interface DbStat {
  connections: number;
  size: string;
  uptime: string;
  version: string;
}

interface RecentLog {
  id: number;
  message: string;
  timestamp: string;
}

export default function PostgreSQLDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DbStat | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'activity'>('metrics');

  useEffect(() => {
    async function fetchDatabaseStats() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/db-stats');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch database stats: ${response.statusText}`);
        }
        
        const data = await response.json();
        setStats(data);
        
        // Also fetch recent logs
        const logsResponse = await fetch('/api/admin/logs?limit=5');
        
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          setRecentLogs(logsData);
        }
      } catch (err) {
        console.error('Error fetching database stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchDatabaseStats();
  }, []);  if (loading) {
    return <div className="py-4 dark:text-gray-300">Loading database metrics...</div>;
  }

  if (error) {
    return (
      <div className="py-4 text-red-600 dark:text-red-400">
        <p>Error loading database metrics: {error}</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none ${
            activeTab === 'metrics'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
          }`}
          onClick={() => setActiveTab('metrics')}
        >
          Database Metrics
        </button>
        <button
          className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none ${
            activeTab === 'activity'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
          }`}
          onClick={() => setActiveTab('activity')}
        >
          Recent Activity
        </button>
      </div>

      {/* Metrics tab content */}
      {activeTab === 'metrics' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Connections</h3>
            <p className="text-2xl font-bold">{stats.connections}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Database Size</h3>
            <p className="text-2xl font-bold">{stats.size}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Uptime</h3>
            <p className="text-2xl font-bold">{stats.uptime}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">PostgreSQL Version</h3>
            <p className="text-2xl font-bold">{stats.version}</p>
          </div>
        </div>
      )}

      {/* Activity tab content */}
      {activeTab === 'activity' && (
        <div>
          <h3 className="text-lg font-medium mb-3">Recent Database Activity</h3>
          {recentLogs.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No recent database activity found.</p>
          )}
          <div className="mt-4">
            <a 
              href="/admin/logs" 
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all logs →
            </a>
          </div>
        </div>
      )}

      {!stats && activeTab === 'metrics' && (
        <p className="dark:text-gray-300">No database metrics available.</p>
      )}
    </div>
  );
}
