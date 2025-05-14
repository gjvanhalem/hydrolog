import React from 'react';
import { render, screen, waitFor } from '@/test-utils';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/app/components/ProtectedRoute';
import { useAuth } from '@/app/components/AuthContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn().mockReturnValue('/test-path'),
}));

jest.mock('@/app/components/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('ProtectedRoute', () => {
  const mockPush = jest.fn();
  const mockSaveRedirectUrl = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });
  
  it('renders a loading state when auth is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
      saveRedirectUrl: mockSaveRedirectUrl,
    });
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Check loading state is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    // Child content should not be rendered
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
  
  it('redirects to login when user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      saveRedirectUrl: mockSaveRedirectUrl,
    });
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Authentication error message should be shown
    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    
    // Check that redirect URL was saved
    expect(mockSaveRedirectUrl).toHaveBeenCalledWith('/test-path');
    
    // Check that redirect was triggered
    expect(mockPush).toHaveBeenCalledWith('/login');
    
    // Child content should not be rendered
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
  
  it('renders child content when user is authenticated', () => {
    // Mock an authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, email: 'test@example.com' },
      isLoading: false,
      saveRedirectUrl: mockSaveRedirectUrl,
    });
    
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    
    // Child content should be rendered
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    
    // No redirect should happen
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockSaveRedirectUrl).not.toHaveBeenCalled();
  });
});
