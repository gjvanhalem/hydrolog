import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import AdminClient from './admin-client';

export const metadata: Metadata = {
  title: 'HydroLog - Admin Dashboard',
  description: 'Administration dashboard for HydroLog',
};

export default function AdminPage() {
  return (    <div className="container mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Administration Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">User Management</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Manage user accounts and permissions</p>
          <Link href="/admin/users" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Manage Users →
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">System Configuration</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Configure application settings</p>
          <Link href="/admin/settings" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Settings →
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Logs & Monitoring</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">View application logs and performance</p>
          <Link href="/admin/logs" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            View Logs →
          </Link>
        </div>
      </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow mb-8">
        <h2 className="text-2xl font-semibold mb-4">Database Management</h2>
        <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700 dark:text-blue-300">
            <strong>PostgreSQL Migration Complete!</strong> Your database is now running on PostgreSQL.
          </p>
        </div>
        
        <div className="space-y-2 mb-6">
          <p><strong>Database Type:</strong> PostgreSQL</p>
          <p><strong>Connection:</strong> {process.env.DATABASE_URL ? 'Configured' : 'Not Configured'}</p>
          <p><strong>Status:</strong> Active</p>
        </div>
        
        <div className="flex space-x-4">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Create Backup
          </button>
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
            Run Diagnostics
          </button>
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
            Clear Cache
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
        <Suspense fallback={<div>Loading PostgreSQL dashboard...</div>}>
          <AdminClient />
        </Suspense>
      </div>
    </div>
  );
}