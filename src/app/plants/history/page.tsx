import { Metadata } from 'next';
import PlantHistoryContent from './plant-history-content';
import ProtectedRoute from '@/app/components/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Plant History | HydroLog',
  description: 'Historical overview of all plants in your hydroponic system'
};

export default function HistoryPage() {
  // Force client-side rendering for this component to ensure auth check works
  return (
    <ProtectedRoute>
      <PlantHistoryContent />
    </ProtectedRoute>
  );
}
