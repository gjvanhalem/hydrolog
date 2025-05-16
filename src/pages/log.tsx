'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * This legacy page redirects to the new system/record page
 * as all logging functionality has been consolidated there
 */
export default function LegacyLogPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/system/record');
  }, [router]);
  
  return (
    <div className="container mx-auto p-4 text-center">
      <p className="text-gray-600 dark:text-gray-400">Redirecting to system record page...</p>
    </div>
  );
}