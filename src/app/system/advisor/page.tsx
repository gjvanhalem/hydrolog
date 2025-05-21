'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthContext';
import AgentAdvisor from '@/app/components/AgentAdvisor';
import Link from 'next/link';

export default function AdvisorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user !== null) {
      setLoading(false);
    }
  }, [user]);

  // Redirect to login if not authenticated
  if (!loading && !user) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="mb-4">You need to be logged in to access the advisor.</p>
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Hydroponic Advisor</h1>
        <Link
          href="/system/manage"
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to System Management
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
          <p className="ml-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          <p className="mb-6 text-gray-700 dark:text-gray-300">
            Ask the AI advisor for help optimizing your hydroponic environment or 
            for recommendations on what to plant based on your current system parameters.
          </p>
          
          <AgentAdvisor className="mt-4" />
          
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
            <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-2">
              How to use the Advisor
            </h2>
            <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>Ask about optimizing your current system parameters</li>
              <li>Request plant recommendations based on your current environment</li>
              <li>Get advice on adjusting pH, EC, TDS, and temperature</li>
              <li>Learn about ideal growing conditions for specific plants</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
