import { render, screen } from '@/test-utils';
import LogEntry from '@/app/system/daily/LogEntry';

describe('LogEntry', () => {
  const defaultProps = {
    id: 1,
    type: 'ph_measurement',
    value: 6.5,
    unit: 'pH',
    logDate: new Date('2025-05-13T10:30:00')
  };

  it('renders the log entry with all required fields', () => {
    render(<LogEntry {...defaultProps} />);
    
    // Check type is displayed and formatted correctly
    expect(screen.getByText('PH MEASUREMENT')).toBeInTheDocument();
    
    // Check value and unit are displayed
    expect(screen.getByText('Value: 6.5 pH')).toBeInTheDocument();
      // Check date is displayed correctly
    expect(screen.getByText(/13\/05\/2025/)).toBeInTheDocument();
  });

  it('renders note when provided', () => {
    render(<LogEntry {...defaultProps} note="Test note content" />);
    expect(screen.getByText('Test note content')).toBeInTheDocument();
  });

  it('does not render note when not provided', () => {
    render(<LogEntry {...defaultProps} />);
    expect(screen.queryByText(/note/i)).not.toBeInTheDocument();
  });

  it('handles null note properly', () => {
    render(<LogEntry {...defaultProps} note={null} />);
    expect(screen.queryByText(/note/i)).not.toBeInTheDocument();
  });

  it('formats different measurement types correctly', () => {
    render(<LogEntry {...defaultProps} type="ec_measurement" value={1200} unit="µS/cm" />);
    expect(screen.getByText('EC MEASUREMENT')).toBeInTheDocument();
    expect(screen.getByText('Value: 1200 µS/cm')).toBeInTheDocument();
  });
});
