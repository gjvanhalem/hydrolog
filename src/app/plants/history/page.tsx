import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ProtectedRoute from '@/app/components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Redirecting to Reports & History | HydroLog',
  description: 'Historical overview of all plants in your hydroponic system'
};

export default function HistoryPage() {
  // Redirect users from the old plant history URL to the new combined reports page
  // Include the tab parameter to automatically focus on the plant history tab
  return (
    <ProtectedRoute>
      {/* This will execute client-side after auth check */}
      {typeof window !== 'undefined' && redirect('/reports?tab=plant-history')}
      <p className="p-6">Redirecting to Reports & History page...</p>
    </ProtectedRoute>
  );
}
