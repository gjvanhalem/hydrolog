import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import ProtectedRoute from '@/app/components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Redirecting to System Management | HydroLog',
  description: 'Plant history is now available in the System Management section'
};

export default function HistoryPage() {
  // Redirect users from the plant history URL to the system management page
  // where plant history is now located
  return (
    <ProtectedRoute>
      {/* This will execute client-side after auth check */}
      {typeof window !== 'undefined' && redirect('/system/manage')}
      <p className="p-6">Redirecting to System Management page...</p>
    </ProtectedRoute>
  );
}
