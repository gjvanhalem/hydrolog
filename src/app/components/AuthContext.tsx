'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types
type SystemType = {
  id: number;
  name: string;
  rows?: number;
  positionsPerRow?: number[] | string;
};

type UserSystemType = {
  id: number;
  systemId: number;
  isActive: boolean;
  system: SystemType;
};

type User = {
  id: number;
  email: string;
  name?: string;
  systems?: UserSystemType[];
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    name?: string,
    systemDetails?: { systemName: string; rows: number; positionsPerRow: number[] }
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  saveRedirectUrl: (url: string) => void;
  getRedirectUrl: () => string | null;
  clearRedirectUrl: () => void;
  addSystem: (systemData: { name: string; rows: number; positionsPerRow: number[] }) => Promise<{ success: boolean; error?: string }>;
  removeSystem: (systemId: number) => Promise<{ success: boolean; error?: string }>;
  switchSystem: (systemId: number) => Promise<{ success: boolean; error?: string }>;
  getActiveSystem: () => UserSystemType | undefined;
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
    }  };

  // Signup function
  const signup = async (
    email: string,
    password: string,
    name?: string,
    systemDetails?: { systemName: string; rows: number; positionsPerRow: number[] }
  ) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          ...systemDetails,
        }),
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

  // Add a new system for the current user
  const addSystem = async (systemData: { name: string; rows: number; positionsPerRow: number[] }) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    try {
      const res = await fetch('/api/system/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to add system' };
      }
      
      // Update user state with the new system
      if (data.user) {
        setUser(data.user);
      } else {
        // Refresh user data if full user object wasn't returned
        const userRes = await fetch('/api/auth/user');
        const userData = await userRes.json();
        if (userRes.ok && userData.user) {
          setUser(userData.user);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Add system error', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Remove a system for the current user
  const removeSystem = async (systemId: number) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    try {
      const res = await fetch(`/api/system/${systemId}/remove`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to remove system' };
      }
      
      // Update user state with the updated systems
      if (data.user) {
        setUser(data.user);
      } else {
        // Refresh user data if full user object wasn't returned
        const userRes = await fetch('/api/auth/user');
        const userData = await userRes.json();
        if (userRes.ok && userData.user) {
          setUser(userData.user);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Remove system error', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Switch to a different system
  const switchSystem = async (systemId: number) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    try {
      const res = await fetch(`/api/system/${systemId}/activate`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to switch system' };
      }
      
      // Update user state with the updated systems
      if (data.user) {
        setUser(data.user);
      } else {
        // Refresh user data if full user object wasn't returned
        const userRes = await fetch('/api/auth/user');
        const userData = await userRes.json();
        if (userRes.ok && userData.user) {
          setUser(userData.user);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Switch system error', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Get the active system for the current user
  const getActiveSystem = (): UserSystemType | undefined => {
    if (!user || !user.systems || user.systems.length === 0) {
      return undefined;
    }
    
    return user.systems.find(system => system.isActive);
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
    addSystem,
    removeSystem,
    switchSystem,
    getActiveSystem,
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
