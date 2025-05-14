import { Metadata } from 'next';
import PageWrapper from './page-wrapper';

export const metadata: Metadata = {
  title: 'System Reports | HydroLog',
  description: 'View and analyze system measurements and plant growth data over time'
};

export default function ReportsPage() {
  return <PageWrapper />;
}
