import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'System Log History | HydroLog',
  description: 'View complete log history of your hydroponic system measurements'
};

export default async function DailyLogPage() {
  // Redirect to the combined reports page with log history tab selected
  redirect('/reports?tab=log-history');
  );
}
