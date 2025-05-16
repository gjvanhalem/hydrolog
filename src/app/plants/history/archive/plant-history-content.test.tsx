import React from 'react';
import { render, screen, waitFor } from '@/test-utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthContext';
import PlantHistoryContent from '../plant-history-content';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/app/components/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('PlantHistoryContent', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
    });
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    });
  });
  
  it('redirects to login when not authenticated', async () => {
    // Set up auth context to return no user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    });
    
    render(<PlantHistoryContent />);
    
    // Check that fetch was not called
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText(/Authentication required/i)).toBeInTheDocument();
    });
    
    // Should redirect to login
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
  
  it('handles 401 response correctly', async () => {
    // Set up auth context to return a user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, email: 'test@example.com' },
      isLoading: false,
    });
    
    // Mock fetch to return 401
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
    });
    
    render(<PlantHistoryContent />);
    
    // Should show authentication error
    await waitFor(() => {
      expect(screen.getByText(/Authentication error/i)).toBeInTheDocument();
    });
    
    // Should attempt to refresh and retry
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
  
  it('fetches and displays plant history when authenticated', async () => {
    // Set up auth context to return a user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, email: 'test@example.com' },
      isLoading: false,
    });
    
    // Mock plant history data
    const mockPlants = [
      {
        id: 1,
        name: 'Tomato',
        type: 'Vegetable',
        status: 'removed',
        logs: [],
        startDate: '2025-04-01T00:00:00Z',
        updatedAt: '2025-05-10T12:00:00Z',
      },
    ];
    
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockPlants),
    });
    
    render(<PlantHistoryContent />);
    
    // Should show loading state first
    expect(screen.getByText(/Loading plant history/i)).toBeInTheDocument();
    
    // Should make API request with credentials
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/plants/history',
      expect.objectContaining({
        credentials: 'include',
      })
    );
    
    // Should display plant history
    await waitFor(() => {
      expect(screen.getByText('Plant History')).toBeInTheDocument();
    });
  });
});
