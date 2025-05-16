'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * SystemPage now just redirects to the system manage page
 * as all system functionality is now consolidated there
 */
export default function SystemPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/system/manage');
  }, [router]);
  
  return (
    <div className="container mx-auto p-4 text-center">
      <p className="text-gray-600 dark:text-gray-400">Redirecting to system management...</p>
    </div>
  );
}
