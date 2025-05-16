'use client';

import dynamic from 'next/dynamic';

// Dynamically import the PostgreSQL dashboard with client-side rendering only
const PostgreSQLDashboard = dynamic(
  () => import('./postgres-dashboard'),
  { ssr: false }
);

export default function AdminClient() {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">PostgreSQL Database Metrics</h2>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-lg">
        <PostgreSQLDashboard />
      </div>
    </div>
  );
}
