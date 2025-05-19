import { Metadata } from 'next';
import ReportsClientWrapper from './client-wrapper';

export const metadata: Metadata = {
  title: 'System Reports & History | HydroLog',
  description: 'View system measurements, trends, and plant growth history over time'
};

export default function ReportsPage() {
  return <ReportsClientWrapper />;
}
