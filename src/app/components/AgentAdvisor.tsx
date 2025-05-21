'use client';

import { useState } from 'react';
import { fetchWithRetry } from '@/lib/api-utils';
import { useAuth } from '@/app/components/AuthContext';
import ReactMarkdown from 'react-markdown';

interface AgentAdvisorProps {
  systemId?: number; // Optional system ID
  className?: string;
}

export default function AgentAdvisor({ systemId, className = '' }: AgentAdvisorProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [systemName, setSystemName] = useState<string | null>(null);
  const { getActiveSystem } = useAuth();
  
  const activeSystem = getActiveSystem();
  
  // Example queries to help users get started
  const exampleQueries = [
    "How can I optimize my system for the current plants?",
    "What plants would grow well in my current system?",
    "What are the ideal parameters for my system?",
    "Suggest some plants I could grow in my system"
  ];

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a question or request');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const targetSystemId = systemId || activeSystem?.systemId;

      if (!targetSystemId) {
        setError('No system selected');
        setIsLoading(false);
        return;
      }

      const response = await fetchWithRetry('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          systemId: targetSystemId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get advice from the AI agent');
      }

      const data = await response.json();
      setResponse(data.response);
      setSystemName(data.systemName);
    } catch (err) {
      console.error('Error querying AI agent:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">
          Hydroponic Advisor
        </h2>
        {systemName && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            System: {systemName}
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <form onSubmit={handleQuerySubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Ask about plant selection or environmental optimization..."
            className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                <span>Thinking...</span>
              </div>
            ) : (
              'Ask'
            )}
          </button>
        </form>
      </div>

      {!response && !error && !isLoading && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Try asking about:
          </p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleQuery(example)}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md mb-4">
          {error}
        </div>
      )}

      {response && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md overflow-y-auto max-h-96">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>
              {response}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
