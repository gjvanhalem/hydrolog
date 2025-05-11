import { Metadata } from 'next';
import SystemLogForm from '@/app/system/record/log-form';

export const metadata: Metadata = {
  title: 'Record System Measurement | HydroLog',
  description: 'Record new measurements for your hydroponic system'
};

export default function SystemLogPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Record System Measurement</h1>
      <div className="max-w-2xl mx-auto">
        <SystemLogForm />
      </div>
    </div>
  );
}
