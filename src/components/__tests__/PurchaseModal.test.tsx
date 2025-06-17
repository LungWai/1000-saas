import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PurchaseModal from '../PurchaseModal';

// Mock toast hook
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
const mockShowLoading = jest.fn().mockReturnValue({ id: 'loading-toast' });
const mockDismiss = jest.fn();

jest.mock('@/hooks/useToastNotification', () => {
  return () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showLoading: mockShowLoading,
    dismiss: mockDismiss,
  });
});

// Mock router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('PurchaseModal Component', () => {
  const mockProps = {
    gridId: 'grid-123',
    price: 100,
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Grid',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful fetch by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/test' }),
    });
  });

  it('renders correctly when open', () => {
    render(<PurchaseModal {...mockProps} />);
    
    expect(screen.getByText('Purchase Grid')).toBeInTheDocument();
    expect(screen.getByText('Test Grid')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<PurchaseModal {...{ ...mockProps, isOpen: false }} />);
    
    expect(screen.queryByText('Purchase Grid')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    render(<PurchaseModal {...mockProps} />);
    
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    render(<PurchaseModal {...mockProps} />);
    
    // Find the backdrop by aria-label
    const backdrop = screen.getByRole('dialog').parentElement;
    fireEvent.click(backdrop as HTMLElement);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<PurchaseModal {...mockProps} />);
    
    fireEvent.keyDown(window, { key: 'Escape' });
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('submits form data correctly when Purchase button is clicked', async () => {
    render(<PurchaseModal {...mockProps} />);
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.click(screen.getByRole('checkbox', { name: /terms/i }));
    
    // Click purchase button
    await userEvent.click(screen.getByRole('button', { name: /purchase/i }));
    
    // Check that the API was called with the right data
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/checkout/create-session',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          gridId: 'grid-123',
        }),
      })
    );
    
    // Check toast notification was shown
    expect(mockShowLoading).toHaveBeenCalledWith('Processing your purchase...');
  });

  it('handles API success response correctly', async () => {
    const mockWindowLocation = { assign: jest.fn() };
    Object.defineProperty(window, 'location', { value: mockWindowLocation, writable: true });
    
    render(<PurchaseModal {...mockProps} />);
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.click(screen.getByRole('checkbox', { name: /terms/i }));
    
    // Click purchase button
    await userEvent.click(screen.getByRole('button', { name: /purchase/i }));
    
    // Wait for redirect
    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith('https://checkout.stripe.com/test');
    });
    
    // Toast should be dismissed
    expect(mockDismiss).toHaveBeenCalledWith('loading-toast');
  });

  it('handles API error response correctly', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Payment failed' }),
    });
    
    render(<PurchaseModal {...mockProps} />);
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.click(screen.getByRole('checkbox', { name: /terms/i }));
    
    // Click purchase button
    await userEvent.click(screen.getByRole('button', { name: /purchase/i }));
    
    // Check error toast was shown
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Failed to process purchase. Please try again.');
    });
    
    // Loading toast should be dismissed
    expect(mockDismiss).toHaveBeenCalledWith('loading-toast');
  });

  it('handles network errors correctly', async () => {
    // Mock fetch to throw a network error
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<PurchaseModal {...mockProps} />);
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.click(screen.getByRole('checkbox', { name: /terms/i }));
    
    // Click purchase button
    await userEvent.click(screen.getByRole('button', { name: /purchase/i }));
    
    // Check error toast was shown
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Failed to process purchase. Please try again.');
    });
  });

  it('disables Purchase button when form is incomplete', async () => {
    render(<PurchaseModal {...mockProps} />);
    
    // Initially button should be disabled
    expect(screen.getByRole('button', { name: /purchase/i })).toBeDisabled();
    
    // Fill only email
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    
    // Button should still be disabled
    expect(screen.getByRole('button', { name: /purchase/i })).toBeDisabled();
    
    // Check terms
    await userEvent.click(screen.getByRole('checkbox', { name: /terms/i }));
    
    // Button should be enabled
    expect(screen.getByRole('button', { name: /purchase/i })).toBeEnabled();
  });

  it('validates email format', async () => {
    render(<PurchaseModal {...mockProps} />);
    
    // Type invalid email
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    
    // Click somewhere else to trigger validation
    fireEvent.blur(screen.getByLabelText(/email/i));
    
    // Error message should appear
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    
    // Button should be disabled despite terms being checked
    await userEvent.click(screen.getByRole('checkbox', { name: /terms/i }));
    expect(screen.getByRole('button', { name: /purchase/i })).toBeDisabled();
  });
}); 