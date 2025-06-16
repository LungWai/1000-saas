import { render, screen, fireEvent } from '@testing-library/react';
import GridHoverOverlay from '../GridHoverOverlay';

// Mock the useTheme hook
jest.mock('@/lib/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('GridHoverOverlay Component', () => {
  const mockProps = {
    id: 'test-id',
    status: 'empty',
    price: 100,
    title: 'Test Grid',
    description: 'Test description',
    isVisible: true,
    onPurchaseClick: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly for empty grid', () => {
    render(<GridHoverOverlay {...mockProps} />);
    
    // Check status badge
    expect(screen.getByText('empty')).toBeInTheDocument();
    
    // Check price
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('/month')).toBeInTheDocument();
    
    // Check button
    expect(screen.getByRole('button')).toHaveTextContent('Lease');
  });
  
  it('renders correctly for leased grid', () => {
    render(
      <GridHoverOverlay 
        {...mockProps} 
        status="leased" 
        content="This is some content"
      />
    );
    
    // Check status badge
    expect(screen.getByText('leased')).toBeInTheDocument();
    
    // Check title and description
    expect(screen.getByText('Test Grid')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    
    // Check content
    expect(screen.getByText('This is some content')).toBeInTheDocument();
    
    // Check button
    expect(screen.getByRole('button')).toHaveTextContent('Edit');
  });
  
  it('does not render when not visible', () => {
    render(<GridHoverOverlay {...mockProps} isVisible={false} />);
    
    // Nothing should be rendered
    expect(screen.queryByText('empty')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  
  it('calls onPurchaseClick when button is clicked', () => {
    render(<GridHoverOverlay {...mockProps} />);
    
    // Click the button
    fireEvent.click(screen.getByRole('button'));
    
    // Check that onPurchaseClick was called with the ID
    expect(mockProps.onPurchaseClick).toHaveBeenCalledWith('test-id');
  });
  
  it('shows loading state when isLoading is true', () => {
    render(<GridHoverOverlay {...mockProps} isLoading={true} />);
    
    // Loading indicator should be visible
    expect(screen.getByText('...')).toBeInTheDocument();
    
    // Button should be disabled
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('truncates long title and description', () => {
    const longTitle = 'This is a very long title that should be truncated in the display';
    const longDescription = 'This is a very long description that should be truncated in the display. It has many more characters than should be displayed.';
    
    render(
      <GridHoverOverlay 
        {...mockProps} 
        status="leased"
        title={longTitle}
        description={longDescription}
      />
    );
    
    // Check that title and description are truncated with ellipsis
    expect(screen.getByText(/This is a very long title that.../)).toBeInTheDocument();
    expect(screen.getByText(/This is a very long description that.../)).toBeInTheDocument();
  });
  
  it('parses and displays JSON content correctly', () => {
    const jsonContent = JSON.stringify({ key: 'value', nested: { data: true } });
    
    render(
      <GridHoverOverlay 
        {...mockProps} 
        status="leased"
        content={jsonContent}
      />
    );
    
    // Check that the content is displayed (will be truncated)
    expect(screen.getByText(/{\s+"key": "value",.../)).toBeInTheDocument();
  });
  
  it('displays placeholder when leased grid has no content', () => {
    render(
      <GridHoverOverlay 
        {...mockProps} 
        status="leased"
        description={undefined}
        content={null}
      />
    );
    
    // Check for placeholder text
    expect(screen.getByText('Add content by clicking "Edit"')).toBeInTheDocument();
  });
}); 