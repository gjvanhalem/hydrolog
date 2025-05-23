'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * SystemLogPage redirects to the system record page
 * as log functionality has been consolidated into record
 */
export default function SystemLogPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/system/record');
  }, [router]);
  
  return (
    <div className="container mx-auto p-4 text-center">
      <p className="text-gray-600 dark:text-gray-400">Redirecting to system record page...</p>
    </div>
  );
}
