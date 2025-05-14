'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { logger } from '@/lib/logger';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, saveRedirectUrl } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!isLoading && !user) {
      // Save the current URL for redirect after login
      if (pathname && pathname !== '/login' && pathname !== '/signup') {
        saveRedirectUrl(pathname);
        logger.debug('Redirecting unauthenticated user', { from: pathname, to: '/login' });
      }
      // Redirect to login page immediately
      router.push('/login');
    }
  }, [user, isLoading, router, pathname, saveRedirectUrl]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Immediately show auth error if not logged in
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-8 rounded-lg max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="mb-4">You must be logged in to view this page.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  // User is authenticated, show the protected content
  return <>{children}</>;
}
