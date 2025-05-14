'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types
type User = {
  id: number;
  email: string;
  name?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  saveRedirectUrl: (url: string) => void;
  getRedirectUrl: () => string | null;
  clearRedirectUrl: () => void;
};

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Saved intended URL for redirects
let savedRedirectUrl: string | null = null;

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Force eager refresh of auth status
        const res = await fetch('/api/auth/user', {
          // Prevent caching of auth status
          cache: 'no-store',
          credentials: 'include', // Explicitly include credentials
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'x-timestamp': Date.now().toString(),
          },
        });
        
        if (res.status === 401) {
          // Clear user if unauthorized
          setUser(null);
          console.warn('Authentication check returned 401 Unauthorized');
          return;
        }
        
        const data = await res.json();
        
        if (res.ok && data.user) {
          setUser(data.user);
        } else if (res.ok && !data.user) {
          // API returned OK but no user - ensure we clear any stale state
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to check authentication status', error);
        // Don't clear the user on network errors to prevent flickering
      } finally {
        setIsLoading(false);
      }
    };

    // Initial auth check
    checkAuth();
    
    // Set up periodic auth refresh (every 5 minutes)
    const authRefreshInterval = setInterval(checkAuth, 5 * 60 * 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(authRefreshInterval);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error('Login error', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Signup function
  const signup = async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }
      
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error('Signup error', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      setUser(null);
      // Reload page to reset app state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const saveRedirectUrl = (url: string) => {
    savedRedirectUrl = url;
  };

  const getRedirectUrl = () => {
    return savedRedirectUrl;
  };

  const clearRedirectUrl = () => {
    savedRedirectUrl = null;
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    saveRedirectUrl,
    getRedirectUrl,
    clearRedirectUrl,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use the AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
