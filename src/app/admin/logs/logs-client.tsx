'use client';

import { useState, useEffect } from 'react';

// Define the log entry interface based on our API response
interface LogEntry {
  id: number;
  level: string;
  message: string;
  timestamp: string;
  source: string;
  type: string;
  value: number;
  unit: string;
  note?: string;
  userName: string;
  userId: number;
}

export default function LogsClient() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Fetch logs from our API
  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/logs');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch logs: ${response.statusText}`);
        }
        
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    // Filter by level
    if (filter !== 'all' && log.level !== filter.toUpperCase()) {
      return false;
    }
    
    // Filter by search term
    if (search && !log.message.toLowerCase().includes(search.toLowerCase()) && 
        !log.type.toLowerCase().includes(search.toLowerCase()) &&
        !log.source.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'INFO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return <div className="py-8 text-center">Loading logs...</div>;
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-600 dark:text-red-400">
        <p>Error loading logs: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h2 className="text-xl font-semibold">System Logs</h2>
        
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <div>
            <select 
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div>
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => {
              setLoading(true);
              fetch('/api/admin/logs')
                .then(res => res.json())
                .then(data => {
                  setLogs(data);
                  setLoading(false);
                })
                .catch(err => {
                  console.error('Error refreshing logs:', err);
                  setError(err instanceof Error ? err.message : 'Failed to refresh logs');
                  setLoading(false);
                });
            }}
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="p-3 text-left font-semibold">Timestamp</th>
              <th className="p-3 text-left font-semibold">Level</th>
              <th className="p-3 text-left font-semibold">Source</th>
              <th className="p-3 text-left font-semibold">Message</th>
              <th className="p-3 text-left font-semibold">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                </td>
                <td className="p-3">{log.source}</td>
                <td className="p-3 max-w-[400px] truncate">{log.message}</td>
                <td className="p-3 whitespace-nowrap">{log.userName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredLogs.length === 0 && (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          No logs found matching your criteria.
        </div>
      )}
      
      <div className="mt-6 flex justify-between">
        <div>
          <button 
            onClick={() => {
              // We would implement actual export functionality here
              alert('Export functionality would be implemented here');
            }}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded mr-2"
          >
            Export Logs
          </button>
        </div>
        
        <div className="text-gray-500 dark:text-gray-400">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </div>
    </div>
  );
}
