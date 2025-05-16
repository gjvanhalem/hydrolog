'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';

export default function SystemSelector() {
  const { user, getActiveSystem, switchSystem } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSystem = getActiveSystem();

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle system selection
  const handleSystemSelect = async (systemId: number) => {
    setIsLoading(true);
    try {
      await switchSystem(systemId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching system:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not logged in or has no systems, don't show selector
  if (!user || !user.systems || user.systems.length === 0) {
    return null;
  }

  // If user has only one system, show its name but disable dropdown
  if (user.systems.length === 1) {
    return (
      <div className="relative flex items-center">
        <div className="text-sm font-medium text-green-100 bg-green-700 px-3 py-2 rounded-md">
          {user.systems[0].system.name}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* System selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`text-sm font-medium flex items-center justify-between min-w-[150px] ${
          isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'
        } bg-green-700 text-white px-3 py-2 rounded-md transition-colors`}
      >
        <span className="truncate max-w-[120px]">
          {activeSystem ? activeSystem.system.name : 'Select System'}
        </span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg">
          <div className="py-1 max-h-60 overflow-auto">
            {user.systems.map((userSystem) => (
              <button
                key={userSystem.systemId}
                onClick={() => handleSystemSelect(userSystem.systemId)}
                className={`w-full text-left px-4 py-2 text-sm ${
                  userSystem.isActive
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                {userSystem.system.name}
                {userSystem.isActive && (
                  <span className="ml-2 text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
              <a
                href="/system/manage"
                className="block w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Manage Systems
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
