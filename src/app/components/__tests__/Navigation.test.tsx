import { render, screen } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import Navigation from '@/app/components/Navigation';

// Mock window.matchMedia
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation links', () => {
    render(<Navigation />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Plants')).toBeInTheDocument();
    expect(screen.getByText('Daily Log')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    
    // Check that links are correct
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText('Plants').closest('a')).toHaveAttribute('href', '/plants');
    expect(screen.getByText('Daily Log').closest('a')).toHaveAttribute('href', '/system/daily');
    expect(screen.getByText('Reports').closest('a')).toHaveAttribute('href', '/reports');
    expect(screen.getByText('History').closest('a')).toHaveAttribute('href', '/plants/history');
  });

  it('renders the app title', () => {
    render(<Navigation />);
    expect(screen.getByText('HydroLog')).toBeInTheDocument();
  });

  it('toggles between dark and light mode', async () => {
    render(<Navigation />);
    
    const toggleButton = screen.getByRole('button', { 
      name: /switch to (light|dark) mode/i 
    });
    expect(toggleButton).toBeInTheDocument();
    
    // Initial state should be light mode based on our mock
    expect(toggleButton).toHaveAccessibleName('Switch to dark mode');
    expect(toggleButton.textContent).toBe('🌙');
    
    // Click the button to toggle
    await userEvent.click(toggleButton);
    
    // Should now be dark mode
    expect(toggleButton).toHaveAccessibleName('Switch to light mode');
    expect(toggleButton.textContent).toBe('🌞');
    
    // Verify document class was updated (we can test the function call)
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    // Click again to go back to light mode
    await userEvent.click(toggleButton);
    expect(toggleButton).toHaveAccessibleName('Switch to dark mode');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
  
  it('respects system preference for dark mode', () => {
    // Mock system preference for dark mode
    (window.matchMedia as jest.Mock).mockImplementationOnce((query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? true : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    render(<Navigation />);
    
    const toggleButton = screen.getByRole('button', {
      name: /switch to (light|dark) mode/i
    });
    
    // Initial state should be dark mode based on our mock
    expect(toggleButton).toHaveAccessibleName('Switch to light mode');
    expect(toggleButton.textContent).toBe('🌞');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
