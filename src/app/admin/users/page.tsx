import { Metadata } from 'next';
import UsersClient from './users-client';

export const metadata: Metadata = {
  title: 'HydroLog - User Management',
  description: 'Manage users in the HydroLog system',
};

export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-8 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      
      <div className="mb-6">
        <a 
          href="/admin" 
          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Admin Dashboard
        </a>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
        <UsersClient />
      </div>
    </div>
  );
}
