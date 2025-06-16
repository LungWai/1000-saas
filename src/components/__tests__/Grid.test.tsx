import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Grid from '../Grid';

// Mock the PurchaseModal component
jest.mock('../PurchaseModal', () => {
  return function MockPurchaseModal({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="purchase-modal">
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock API fetch calls
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
);

describe('Grid Component', () => {
  const mockGrid = {
    id: '1',
    content: null,
    customerId: null,
    url: null,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
    user_id: '',
    image_url: '',
    title: 'Test Grid',
    description: 'Test Description',
    external_url: '',
    start_date: new Date(),
    end_date: new Date(),
    status: 'active' as const,
    subscription_id: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders available state correctly', () => {
    render(<Grid grid={mockGrid} />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('opens purchase modal when clicked on available grid', async () => {
    render(<Grid grid={mockGrid} />);
    
    await userEvent.click(screen.getByText('Available'));
    expect(screen.getByTestId('purchase-modal')).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const mockKeyboardNavigation = jest.fn();
    render(
      <Grid 
        grid={mockGrid} 
        onKeyboardNavigation={mockKeyboardNavigation}
      />
    );
    
    const gridElement = screen.getByRole('button');
    gridElement.focus();
    
    // Test arrow key navigation
    fireEvent.keyDown(gridElement, { key: 'ArrowRight' });
    expect(mockKeyboardNavigation).toHaveBeenCalledWith('right', mockGrid.id);
    
    fireEvent.keyDown(gridElement, { key: 'ArrowDown' });
    expect(mockKeyboardNavigation).toHaveBeenCalledWith('down', mockGrid.id);
  });
}); 