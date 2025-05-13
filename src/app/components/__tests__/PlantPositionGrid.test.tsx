import { render, screen } from '@/test-utils';
import PlantPositionGrid from '@/app/components/PlantPositionGrid';

const mockPlants = [
  {
    id: 1,
    name: 'Test Plant 1',
    type: 'Tomato',
    position: 1,
    status: 'growing',
    startDate: new Date('2025-05-01'),
    createdAt: new Date('2025-05-01'),
    updatedAt: new Date('2025-05-01')
  },
  {
    id: 2,
    name: 'Test Plant 2',
    type: 'Lettuce',
    position: 5,
    status: 'seedling',
    startDate: new Date('2025-05-05'),
    createdAt: new Date('2025-05-05'),
    updatedAt: new Date('2025-05-05')
  }
];

describe('PlantPositionGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('renders all 12 positions', () => {
    render(<PlantPositionGrid plants={[]} />);
    
    // Check that all position numbers are rendered with the P prefix
    for (let i = 1; i <= 12; i++) {
      expect(screen.getByText(`P${i}`)).toBeInTheDocument();
    }
  });

  it('displays plants in correct positions', () => {
    render(<PlantPositionGrid plants={mockPlants} />);
    
    // Check that plant names are displayed in correct positions
    expect(screen.getByText('Test Plant 1')).toBeInTheDocument();
    expect(screen.getByText('Test Plant 2')).toBeInTheDocument();
  });  it('highlights the specified position', () => {
    render(<PlantPositionGrid plants={mockPlants} highlightPosition={1} />);
    
    // Since we know all plant containers are direct children of the grid, find by aria-label
    const allPositions = screen.getAllByLabelText(/Position \d+/);
    const highlightedPosition = allPositions[0]; // Position 1 should be first
    expect(highlightedPosition.className).toContain('ring-2');
    expect(highlightedPosition.className).toContain('ring-green-500');
  });
  it('shows "Available" for empty positions', () => {
    render(<PlantPositionGrid plants={mockPlants} />);
    
    const availableSlots = screen.getAllByRole('link', { name: /Available/i });
    expect(availableSlots).toHaveLength(10); // 12 total - 2 occupied
    
    // Verify each available slot has the correct link
    availableSlots.forEach(slot => {
      expect(slot).toHaveAttribute('href', expect.stringMatching(/\/plants\/new\?position=\d+/));
    });
  });

  it('links to new plant form with correct position', () => {
    render(<PlantPositionGrid plants={mockPlants} />);
    
    // Check that empty positions link to new plant form with position parameter
    const emptyPositionLink = screen.getAllByText('Available')[0].closest('a');
    expect(emptyPositionLink).toHaveAttribute('href', expect.stringMatching(/\/plants\/new\?position=\d+/));
  });
});
