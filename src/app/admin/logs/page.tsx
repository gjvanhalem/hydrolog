import { Metadata } from 'next';
import LogsClientWrapper from './client-wrapper';

export const metadata: Metadata = {
  title: 'HydroLog - Logs & Monitoring',
  description: 'View system logs and monitoring data',
};

export default function LogsPage() {
  return (
    <div className="container mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Logs & Monitoring</h1>
      
      <div className="mb-6">
        <a 
          href="/admin" 
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Admin Dashboard
        </a>      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
        <LogsClientWrapper />
      </div>
    </div>
  );
}
