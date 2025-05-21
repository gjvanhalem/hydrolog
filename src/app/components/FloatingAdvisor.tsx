'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthContext';
import AgentAdvisor from './AgentAdvisor';
import Link from 'next/link';

export default function FloatingAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const { getActiveSystem } = useAuth();
  const activeSystem = getActiveSystem();

  // Close the chat window when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Don't close if clicking inside the chat or on the button
      if (target.closest('.floating-advisor-chat') || target.closest('.floating-advisor-button')) {
        return;
      }
      
      // If open and not minimized, minimize it
      if (isOpen && !isMinimized) {
        setIsMinimized(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMinimized]);

  const handleToggleChat = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else {
      setIsMinimized(!isMinimized);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!activeSystem) {
    return null; // Don't show the floating advisor if no system is selected
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Button */}
      <button 
        onClick={handleToggleChat}
        className="floating-advisor-button bg-amber-500 hover:bg-amber-600 text-white rounded-full p-3 shadow-lg flex items-center justify-center"
        aria-label="Open Plant Advisor"
        title="Open Plant Advisor"
      >        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`floating-advisor-chat fixed transition-all duration-300 ease-in-out ${isMinimized ? 'bottom-16 right-4 w-64 h-12' : 'bottom-16 right-4 w-72 sm:w-96 md:w-[450px] h-[500px] max-h-[80vh]'} bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col border border-amber-200 dark:border-amber-800`}>
          {/* Chat Header */}
          <div className="bg-amber-500 dark:bg-amber-600 text-white p-2 flex items-center justify-between">
            <div className="flex items-center">              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="font-medium">Plant Advisor</span>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-amber-600 dark:hover:bg-amber-700 rounded p-1"
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              <button 
                onClick={handleClose}
                className="text-white hover:bg-amber-600 dark:hover:bg-amber-700 rounded p-1"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>          {/* Chat Body */}
          {isMinimized ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Click to get plant advice
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto p-3">
                <AgentAdvisor />
                
                <div className="text-xs text-center mt-3 text-gray-500 dark:text-gray-400 border-t pt-2">
                  <Link href="/system/advisor" className="text-amber-600 dark:text-amber-400 hover:underline">
                    Open full advisor page
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
