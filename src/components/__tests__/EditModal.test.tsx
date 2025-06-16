import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditModal from '../EditModal';

describe('EditModal Component', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    gridId: 'grid-123',
    initialContent: 'Initial content',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<EditModal {...mockProps} />);
    
    expect(screen.getByText('Edit Grid Content')).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toHaveValue('Initial content');
    expect(screen.getByLabelText(/subscription/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<EditModal {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Edit Grid Content')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    render(<EditModal {...mockProps} />);
    
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    render(<EditModal {...mockProps} />);
    
    // Find the backdrop (usually the parent of the dialog)
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement;
    
    fireEvent.click(backdrop as HTMLElement);
    
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('validates form fields', async () => {
    render(<EditModal {...mockProps} />);
    
    // Clear the content field
    const contentInput = screen.getByLabelText(/content/i);
    await userEvent.clear(contentInput);
    
    // Try to submit empty form
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Check validation error is shown
    expect(screen.getByText(/content is required/i)).toBeInTheDocument();
    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates subscription ID format', async () => {
    render(<EditModal {...mockProps} />);
    
    // Type invalid subscription ID
    await userEvent.type(screen.getByLabelText(/subscription/i), 'invalid-id');
    
    // Type valid content and email
    await userEvent.type(screen.getByLabelText(/content/i), 'New content');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    
    // Try to submit form
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Check validation error is shown
    expect(screen.getByText(/subscription id should start with sub_/i)).toBeInTheDocument();
    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(<EditModal {...mockProps} />);
    
    // Type invalid email
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    
    // Type valid content and subscription
    await userEvent.type(screen.getByLabelText(/content/i), 'New content');
    await userEvent.type(screen.getByLabelText(/subscription/i), 'sub_123456');
    
    // Try to submit form
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Check validation error is shown
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(<EditModal {...mockProps} />);
    
    // Type valid data
    const contentInput = screen.getByLabelText(/content/i);
    await userEvent.clear(contentInput);
    await userEvent.type(contentInput, 'New content');
    await userEvent.type(screen.getByLabelText(/subscription/i), 'sub_123456');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    
    // Submit form
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    // Check onSubmit is called with correct data
    expect(mockProps.onSubmit).toHaveBeenCalledWith({
      content: 'New content',
      subscriptionId: 'sub_123456',
      email: 'test@example.com',
      gridId: 'grid-123',
    });
  });

  it('handles image upload correctly', async () => {
    global.URL.createObjectURL = jest.fn(() => 'blob://test-image');
    
    render(<EditModal {...mockProps} />);
    
    // Create a mock file
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/upload image/i);
    
    // Upload file
    await userEvent.upload(input, file);
    
    // Preview should be visible
    expect(screen.getByAltText('Image preview')).toHaveAttribute('src', 'blob://test-image');
    
    // Remove the image
    await userEvent.click(screen.getByText(/remove/i));
    
    // Preview should be gone
    expect(screen.queryByAltText('Image preview')).not.toBeInTheDocument();
  });

  it('handles max content length validation', async () => {
    render(<EditModal {...mockProps} />);
    
    // Create a very long string (exceeding max length)
    const longContent = 'a'.repeat(1001);  // Assuming max length is 1000
    
    // Type long content
    const contentInput = screen.getByLabelText(/content/i);
    await userEvent.clear(contentInput);
    await userEvent.type(contentInput, longContent);
    
    // Focus out to trigger validation
    fireEvent.blur(contentInput);
    
    // Check validation error is shown
    expect(screen.getByText(/content cannot exceed/i)).toBeInTheDocument();
  });

  it('prevents form submission on Escape key', async () => {
    render(<EditModal {...mockProps} />);
    
    // Type valid data
    await userEvent.type(screen.getByLabelText(/content/i), 'New content');
    
    // Press Escape
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    
    // Check form is not submitted
    expect(mockProps.onSubmit).not.toHaveBeenCalled();
    // Check modal is closed
    expect(mockProps.onClose).toHaveBeenCalled();
  });
}); 