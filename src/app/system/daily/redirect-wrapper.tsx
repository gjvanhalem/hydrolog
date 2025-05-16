'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectWrapper() {
  const router = useRouter();

  useEffect(() => {
    router.push('/reports?tab=log-history');
  }, [router]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Redirecting...</h1>
      <p className="dark:text-gray-300">You are being redirected to the reports page.</p>
    </div>
  );
}
