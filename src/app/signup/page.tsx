'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthContext';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemName, setSystemName] = useState('');
  const [rows, setRows] = useState('');
  const [positionsPerRow, setPositionsPerRow] = useState<string[]>(['']); // Keep as string[] for input handling
  
  const { signup, getRedirectUrl, clearRedirectUrl } = useAuth();
  const router = useRouter();
  const handleAddRow = () => {
    setPositionsPerRow([...positionsPerRow, '']);
  };

  const handleRemoveRow = (index: number) => {
    setPositionsPerRow(positionsPerRow.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, value: string) => {
    const updatedRows = [...positionsPerRow];
    updatedRows[index] = value; // Keep as string for input handling
    setPositionsPerRow(updatedRows);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate system details
    if (!systemName || !rows || positionsPerRow.some(row => !row)) {
      setError('Please provide all system details');
      return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate password
    if (!password) {
      setError('Please enter a password');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert string position values to numbers
      const numericPositions = positionsPerRow.map(pos => parseInt(pos, 10));
      
      const result = await signup(email, password, name || undefined, {
        systemName,
        rows: parseInt(rows, 10),
        positionsPerRow: numericPositions,
      });

      if (!result.success) {
        setError(result.error || 'Signup failed');
      } else {
        // Success - redirect to saved URL or home
        const redirectUrl = getRedirectUrl();
        clearRedirectUrl();
        router.push(redirectUrl || '/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 justify-center items-center p-6">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center dark:text-white">Create an Account</h1>
        
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="Your Name"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label htmlFor="systemName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              System Name
            </label>
            <input
              id="systemName"
              type="text"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="My Hydroponic System"
              required
            />
          </div>

          <div>
            <label htmlFor="rows" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rows
            </label>
            <input
              id="rows"
              type="number"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="Number of Rows"
              required
            />
          </div>

          <div>
            <label htmlFor="positionsPerRow" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Positions Per Row
            </label>
            {positionsPerRow.map((row, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="number"
                  value={row}
                  onChange={(e) => handleRowChange(index, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder={`Positions for Row ${index + 1}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  className="px-2 py-1 bg-red-500 text-white rounded-md"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddRow}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Add Row
            </button>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 focus:ring-green-500 focus:ring-offset-green-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="text-sm text-center">
          <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
          <Link href="/login" className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
