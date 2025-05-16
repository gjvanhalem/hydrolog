import { render } from '@/test-utils';
import { redirect } from 'next/navigation';
import HistoryPage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock the ProtectedRoute component to render its children
jest.mock('@/app/components/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('HistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window to be defined
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost/plants/history' },
      writable: true
    });
  });

  it('redirects to reports page with plant-history tab parameter', () => {
    // Define window for client-side rendering check
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true
    });
    
    render(<HistoryPage />);
    
    // Should redirect to reports page with the plant-history tab parameter
    expect(redirect).toHaveBeenCalledWith('/reports?tab=plant-history');
  });

  it('shows loading message when window is not defined', () => {
    // Make window undefined for SSR check
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true
    });
    
    const { getByText } = render(<HistoryPage />);
    
    // Should show loading message
    expect(getByText(/redirecting to reports & history page/i)).toBeInTheDocument();
  });
});
