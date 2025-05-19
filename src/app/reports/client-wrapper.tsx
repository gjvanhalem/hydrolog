'use client';

import dynamic from 'next/dynamic';

// Dynamically import the client component with client-side rendering only
const ReportsPageWrapper = dynamic(
  () => import('./page-wrapper'),
  { ssr: false }
);

export default function ReportsClientWrapper() {
  return <ReportsPageWrapper />;
}
