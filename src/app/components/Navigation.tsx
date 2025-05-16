'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import SystemSelector from './SystemSelector';

export default function Navigation() {
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout, isLoading } = useAuth();

  useEffect(() => {
    // Check system preference on mount
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <>      <header className="bg-green-600 dark:bg-green-800 text-white py-4 relative">
        <div className="container mx-auto flex justify-between items-center px-4">
          <h1 className="text-2xl font-bold">HydroLog</h1>
          
          <div className="flex items-center space-x-4">
            {!isLoading && (
              <div className="text-sm">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <SystemSelector />
                    <span>Welcome, {user.name || user.email.split('@')[0]}</span>
                    <button 
                      onClick={() => logout()}
                      className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded-md text-xs font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link 
                      href="/login" 
                      className="px-3 py-1 hover:bg-green-700 rounded-md transition-colors"
                    >
                      Login
                    </Link>
                    <Link 
                      href="/signup" 
                      className="px-3 py-1 bg-white text-green-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-green-700 dark:bg-green-900 hover:bg-green-800 dark:hover:bg-green-950 transition-colors"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? '🌞' : '🌙'}
            </button>
          </div>
        </div>
      </header>
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="container mx-auto">          <ul className="flex justify-center space-x-6 py-4">            <li><Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Dashboard</Link></li>
            <li><Link href="/plants" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Plants</Link></li>
            <li><Link href="/reports" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Reports & History</Link></li>
            <li><Link href="/system/manage" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Manage Systems</Link></li>
          </ul>
        </div>
      </nav>
    </>
  );
}
