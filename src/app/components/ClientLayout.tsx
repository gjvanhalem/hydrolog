'use client';

import { ReactNode } from 'react';
import Navigation from './Navigation';
import { AuthProvider } from './AuthContext';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <Navigation />
        {children}
      </div>
    </AuthProvider>
  );
}
