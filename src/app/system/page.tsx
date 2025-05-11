import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'System Management | HydroLog',
  description: 'Manage and monitor your hydroponic system'
};

export default function SystemPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">System Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/system/daily"
          className="group block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 hover:shadow-xl dark:hover:shadow-gray-900/80 transition-all duration-200"
        >
          <h2 className="text-xl font-semibold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Daily Log</h2>
          <p className="text-gray-600 dark:text-gray-400">View today's system measurements and logs</p>
        </Link>

        <Link 
          href="/system/record"
          className="group block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 hover:shadow-xl dark:hover:shadow-gray-900/80 transition-all duration-200"
        >
          <h2 className="text-xl font-semibold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Record Measurement</h2>
          <p className="text-gray-600 dark:text-gray-400">Record a new system measurement or log</p>
        </Link>
      </div>
    </div>
  );
}
