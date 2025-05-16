import { render, screen, fireEvent } from '@/test-utils';
import ReportsClient from '../page.client';

// Mock Chart.js components to avoid canvas rendering issues in tests
jest.mock('chart.js');
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mocked-chart" />
}));

// Mock ChartWrapper component
jest.mock('@/app/components/ChartWrapper', () => ({
  __esModule: true,
  default: ({ data, options }: any) => (
    <div data-testid="chart-wrapper">
      <div>Mocked Chart: {data?.datasets?.[0]?.label || 'No data'}</div>
    </div>
  )
}));

describe('ReportsClient', () => {
  const mockSystemLogs = [
    { id: 1, type: 'ph_measurement', value: 6.5, unit: 'pH', createdAt: '2025-05-14T12:00:00Z' },
    { id: 2, type: 'ec_measurement', value: 1.2, unit: 'mS/cm', createdAt: '2025-05-14T12:00:00Z' },
    { id: 3, type: 'tds_measurement', value: 600, unit: 'ppm', createdAt: '2025-05-14T12:00:00Z' },
    { id: 4, type: 'temperature', value: 25, unit: 'C', createdAt: '2025-05-14T12:00:00Z' }
  ];

  const mockPlants = [];
  
  const mockRemovedPlants = [
    {
      id: 1,
      name: 'Tomato Plant',
      type: 'Tomato',
      status: 'removed',
      position: 1,
      startDate: '2025-03-01T00:00:00Z',
      createdAt: '2025-03-01T00:00:00Z',
      updatedAt: '2025-05-01T00:00:00Z',
      logs: [
        {
          id: 1,
          status: 'seedling',
          note: 'Plant started as seedling',
          photo: null,
          logDate: '2025-03-01T00:00:00Z'
        },
        {
          id: 2,
          status: 'removed',
          note: 'Plant removed from system',
          photo: null,
          logDate: '2025-05-01T00:00:00Z'
        }
      ]
    }
  ];
  
  // Helper function to setup window.matchMedia
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    
    // Mock window history functions
    Object.defineProperty(window, 'history', {
      writable: true,
      value: {
        replaceState: jest.fn()
      }
    });

    // Mock URL search params
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        href: 'http://localhost:3000/reports'
      },
      writable: true
    });
  });

  it('renders system charts by default', () => {
    render(
      <ReportsClient 
        systemLogs={mockSystemLogs} 
        plants={mockPlants} 
        removedPlants={mockRemovedPlants} 
      />
    );
    
    // Should display title
    expect(screen.getByText(/system reports & history/i)).toBeInTheDocument();
    
    // Should display chart headings
    expect(screen.getByText(/pH Levels/i)).toBeInTheDocument();
    expect(screen.getByText(/EC Levels/i)).toBeInTheDocument();
    expect(screen.getByText(/TDS Levels/i)).toBeInTheDocument();
    expect(screen.getByText(/Temperature/i)).toBeInTheDocument();
    
    // Should not display plant history
    expect(screen.queryByText(/No removed plants in history yet/i)).not.toBeInTheDocument();
  });
  
  it('switches to plant history tab when clicked', () => {
    render(
      <ReportsClient 
        systemLogs={mockSystemLogs} 
        plants={mockPlants} 
        removedPlants={mockRemovedPlants} 
      />
    );
    
    // Click the Plant History tab
    fireEvent.click(screen.getByText(/Plant History/i));
    
    // Should now display plant history content
    expect(screen.getByText(/Tomato Plant/i)).toBeInTheDocument();
    
    // Should not display charts
    expect(screen.queryByText(/pH Levels/i)).not.toBeInTheDocument();
  });

  it('loads plant history tab by default if tab parameter is present', () => {
    // Set up URL with tab parameter
    Object.defineProperty(window, 'location', {
      value: {
        search: '?tab=plant-history',
        href: 'http://localhost:3000/reports?tab=plant-history'
      },
      writable: true
    });
    
    render(
      <ReportsClient 
        systemLogs={mockSystemLogs} 
        plants={mockPlants} 
        removedPlants={mockRemovedPlants} 
      />
    );
    
    // Should display plant history content directly
    expect(screen.getByText(/Tomato Plant/i)).toBeInTheDocument();
    
    // Should not display charts
    expect(screen.queryByText(/pH Levels/i)).not.toBeInTheDocument();
  });
});
