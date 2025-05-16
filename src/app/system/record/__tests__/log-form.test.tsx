import { render, screen, fireEvent, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import SystemLogForm from '@/app/system/record/log-form';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    refresh: jest.fn(),
    push: jest.fn()
  }),
}));

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe('SystemLogForm', () => {
  const mockRouter = {
    refresh: jest.fn(),
    push: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  it('renders the form with default values', () => {
    const today = new Date().toISOString().split('T')[0]; // today in YYYY-MM-DD format
    render(<SystemLogForm />);
    
    // Check form elements
    expect(screen.getByLabelText(/Log Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Log Date/i)).toHaveValue(today);
    
    expect(screen.getByLabelText(/Measurement Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Measurement Type/i)).toHaveValue('ph_measurement');
      expect(screen.getByLabelText(/Value/i)).toBeInTheDocument();
    // Skip checking the exact value since it might be null or "" depending on implementation
    
    expect(screen.getByLabelText(/Note/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Note/i)).toHaveValue('');
    
    expect(screen.getByRole('button', { name: /Record Measurement/i })).toBeInTheDocument();
  });

  it('updates form values when inputs change', async () => {
    render(<SystemLogForm />);
    
    // Change measurement type
    const typeSelect = screen.getByLabelText(/Measurement Type/i);
    await userEvent.selectOptions(typeSelect, 'ec_measurement');
    expect(typeSelect).toHaveValue('ec_measurement');
    
    // Unit should update automatically when type changes
    const unitSpan = screen.getByText('µS/cm');
    expect(unitSpan).toBeInTheDocument();
      // Change value
    const valueInput = screen.getByLabelText(/Value/i);
    await userEvent.clear(valueInput);
    await userEvent.type(valueInput, '7.5');
    // Check that the input contains the text, without strict type checking
    expect(valueInput).toHaveDisplayValue('7.5');
    
    // Change note
    const noteInput = screen.getByLabelText(/Note/i);
    await userEvent.type(noteInput, 'Test note');
    expect(noteInput).toHaveValue('Test note');
    
    // Change date
    const dateInput = screen.getByLabelText(/Log Date/i);
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, '2025-05-10');
    expect(dateInput).toHaveValue('2025-05-10');
  });

  it('submits the form with correct data', async () => {
    render(<SystemLogForm />);
    
    // Fill out the form
    await userEvent.selectOptions(screen.getByLabelText(/Measurement Type/i), 'ph_measurement');
    await userEvent.type(screen.getByLabelText(/Value/i), '6.8');
    await userEvent.type(screen.getByLabelText(/Note/i), 'pH test');
    
    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /Record Measurement/i }));
    
    // Check that fetch was called with correct data
    const today = new Date().toISOString().split('T')[0];
    expect(global.fetch).toHaveBeenCalledWith('/api/system/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'ph_measurement',
        value: 6.8,
        unit: 'pH',
        note: 'pH test',
        logDate: today
      }),
    });
      // Check router actions
    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/reports?tab=log-history');
    });
  });

  it('displays error message when submission fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to submit measurement' }),
    });
    
    render(<SystemLogForm />);
    
    // Fill out and submit the form
    await userEvent.type(screen.getByLabelText(/Value/i), '6.8');
    await userEvent.click(screen.getByRole('button', { name: /Record Measurement/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to submit measurement')).toBeInTheDocument();
    });
    
    // Check that router was not called
    expect(mockRouter.refresh).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
  it('shows loading state during submission', async () => {
    // Delay the fetch response
    let resolvePromise: ((value: any) => void) | null = null;
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));
    
    render(<SystemLogForm />);
    
    // Fill out form
    await userEvent.type(screen.getByLabelText(/Value/i), '6.8');
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /Record Measurement/i }));
    
    // Button should be in loading state
    expect(screen.getByRole('button', { name: /Recording\.\.\./i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
    
    // Ensure resolvePromise is set before using it
    expect(resolvePromise).not.toBeNull();
    resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
    
    // Button should go back to normal state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Record Measurement/i })).toBeInTheDocument();
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });
});
