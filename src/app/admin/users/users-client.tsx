'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: number;
  name: string | null;
  email: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    plants: number;
    systems: number;
  };
}

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/users');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) {
    return <div className="py-4 dark:text-gray-300">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="py-4 text-red-600 dark:text-red-400">
        <p>Error loading users: {error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="py-4 dark:text-gray-300">No users found.</div>;
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">System Users</h2>
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
          Add New User
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="p-3 text-left font-semibold">ID</th>
              <th className="p-3 text-left font-semibold">Name</th>
              <th className="p-3 text-left font-semibold">Email</th>
              <th className="p-3 text-left font-semibold">Plants</th>
              <th className="p-3 text-left font-semibold">Systems</th>
              <th className="p-3 text-left font-semibold">Created</th>
              <th className="p-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3">{user.id}</td>
                <td className="p-3">{user.name || 'N/A'}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user._count.plants}</td>
                <td className="p-3">{user._count.systems}</td>
                <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="p-3 space-x-2">
                  <button className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    Edit
                  </button>
                  <button className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
