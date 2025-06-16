import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GridItem from '../GridItem';

// Mock child components
jest.mock('../GridHoverOverlay', () => {
  return function MockGridHoverOverlay({ onPurchaseClick }) {
    return (
      <div data-testid="grid-hover-overlay">
        <button data-testid="purchase-button" onClick={() => onPurchaseClick('test-id')}>
          Purchase
        </button>
      </div>
    );
  };
});

jest.mock('../EditModal', () => {
  return function MockEditModal({ isOpen, onClose, onSubmit }) {
    return isOpen ? (
      <div data-testid="edit-modal">
        <button data-testid="close-button" onClick={onClose}>Close</button>
        <button 
          data-testid="submit-button" 
          onClick={() => onSubmit({ subscriptionId: 'sub_123', email: 'test@example.com', gridId: 'test-id' })}
        >
          Submit
        </button>
      </div>
    ) : null;
  };
});

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    return <img {...props} />;
  },
}));

// Mock toast hook
jest.mock('@/hooks/useToastNotification', () => {
  return () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showLoading: jest.fn().mockReturnValue({ id: 'toast-id' }),
    dismiss: jest.fn(),
  });
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
);

describe('GridItem Component', () => {
  const mockProps = {
    id: 'test-id',
    status: 'empty',
    price: 100,
    title: 'Test Grid',
    description: 'Test description',
    onPurchaseClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: jest.fn() },
      writable: true,
    });
  });

  it('renders basic grid item correctly', () => {
    render(<GridItem {...mockProps} />);
    expect(screen.getByText('Test Grid')).toBeInTheDocument();
  });

  it('shows hover overlay when hovered', async () => {
    render(<GridItem {...mockProps} />);
    
    const gridItem = screen.getByRole('button');
    fireEvent.mouseEnter(gridItem);
    
    // Use a small timeout to allow for debounce
    await new Promise(r => setTimeout(r, 200));
    
    expect(screen.getByTestId('grid-hover-overlay')).toBeInTheDocument();
  });

  it('calls onPurchaseClick when purchase button is clicked', async () => {
    render(<GridItem {...mockProps} />);
    
    const gridItem = screen.getByRole('button');
    fireEvent.mouseEnter(gridItem);
    
    // Use a small timeout to allow for debounce
    await new Promise(r => setTimeout(r, 200));
    
    const purchaseButton = screen.getByTestId('purchase-button');
    await userEvent.click(purchaseButton);
    
    expect(mockProps.onPurchaseClick).toHaveBeenCalled();
  });

  it('opens edit modal for leased grids', async () => {
    render(<GridItem {...{ ...mockProps, status: 'leased' }} />);
    
    const gridItem = screen.getByRole('button');
    await userEvent.click(gridItem);
    
    expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
  });

  it('closes edit modal when close button is clicked', async () => {
    render(<GridItem {...{ ...mockProps, status: 'leased' }} />);
    
    // Open modal
    const gridItem = screen.getByRole('button');
    await userEvent.click(gridItem);
    
    // Close modal
    const closeButton = screen.getByTestId('close-button');
    await userEvent.click(closeButton);
    
    expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
  });

  it('submits edit form and handles successful response', async () => {
    render(<GridItem {...{ ...mockProps, status: 'leased' }} />);
    
    // Open modal
    const gridItem = screen.getByRole('button');
    await userEvent.click(gridItem);
    
    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    await userEvent.click(submitButton);
    
    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/grids/test-id/content`,
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    
    // Should reload page on success
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('handles keyboard focus correctly', () => {
    render(<GridItem {...mockProps} />);
    
    const gridItem = screen.getByRole('button');
    fireEvent.focus(gridItem);
    
    // Data attribute should indicate focus
    expect(gridItem).toHaveAttribute('data-hovered', 'true');
  });

  it('handles keyboard navigation', () => {
    const mockKeyboardNav = jest.fn();
    render(<GridItem {...mockProps} onKeyboardNavigation={mockKeyboardNav} />);
    
    const gridItem = screen.getByRole('button');
    fireEvent.keyDown(gridItem, { key: 'ArrowRight' });
    
    expect(mockKeyboardNav).toHaveBeenCalledWith('right', 'test-id');
  });

  it('applies proper image rendering for grid with image', () => {
    render(<GridItem {...mockProps} imageUrl="/test-image.jpg" />);
    
    expect(screen.getByAltText('Test Grid')).toBeInTheDocument();
  });
}); 