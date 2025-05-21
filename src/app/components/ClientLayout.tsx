'use client';

import { ReactNode } from 'react';
import Navigation from './Navigation';
import { AuthProvider } from './AuthContext';
import FloatingAdvisor from './FloatingAdvisor';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <Navigation />
        {children}
        <FloatingAdvisor />
      </div>
    </AuthProvider>
  );
}
