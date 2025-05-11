'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Navigation() {
  const [darkMode, setDarkMode] = useState(false);

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
    <>
      <header className="bg-green-600 dark:bg-green-800 text-white text-center py-4 relative">
        <h1 className="text-2xl font-bold">HydroLog</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-green-700 dark:bg-green-900 hover:bg-green-800 dark:hover:bg-green-950 transition-colors"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '🌞' : '🌙'}
        </button>
      </header>
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="container mx-auto">          <ul className="flex justify-center space-x-6 py-4">
            <li><Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Dashboard</Link></li>
            <li><Link href="/plants" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Plants</Link></li>
            <li><Link href="/system/daily" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Daily Log</Link></li>
            <li><Link href="/reports" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">Reports</Link></li>
            <li><Link href="/plants/history" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">History</Link></li>
          </ul>
        </div>
      </nav>
    </>
  );
}
