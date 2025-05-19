'use client';

import dynamic from 'next/dynamic';

// Dynamically import the logs client component with client-side rendering only
const LogsClientComponent = dynamic(
  () => import('./logs-client'),
  { ssr: false }
);

export default function LogsClientWrapper() {
  return <LogsClientComponent />;
}
