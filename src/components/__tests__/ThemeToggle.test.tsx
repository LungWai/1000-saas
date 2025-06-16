import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../ThemeToggle';
import { useTheme } from '@/lib/ThemeProvider';

// Mock the ThemeProvider hook
jest.mock('@/lib/ThemeProvider', () => ({
  useTheme: jest.fn(),
}));

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders light theme UI correctly', () => {
    // Mock the theme hook to return light theme
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      toggleTheme: jest.fn(),
    });
    
    render(<ThemeToggle />);
    
    // Check that the button is rendered
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    
    // Check that the sun icon is visible in light mode
    const sunIcon = screen.getByTitle(/switch to dark theme/i);
    expect(sunIcon).toBeInTheDocument();
  });
  
  it('renders dark theme UI correctly', () => {
    // Mock the theme hook to return dark theme
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      toggleTheme: jest.fn(),
    });
    
    render(<ThemeToggle />);
    
    // Check that the button is rendered
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    
    // Check that the moon icon is visible in dark mode
    const moonIcon = screen.getByTitle(/switch to light theme/i);
    expect(moonIcon).toBeInTheDocument();
  });
  
  it('calls toggleTheme when clicked', async () => {
    // Create a mock function for toggleTheme
    const mockToggleTheme = jest.fn();
    
    // Mock the theme hook with the mock function
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
    });
    
    render(<ThemeToggle />);
    
    // Click the theme toggle button
    const button = screen.getByRole('button', { name: /toggle theme/i });
    await userEvent.click(button);
    
    // Check that toggleTheme was called
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
  
  it('is accessible via keyboard', async () => {
    // Mock the theme hook
    const mockToggleTheme = jest.fn();
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
    });
    
    render(<ThemeToggle />);
    
    // Focus the button with tab
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /toggle theme/i })).toHaveFocus();
    
    // Activate with Enter key
    await userEvent.keyboard('{Enter}');
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    
    // Reset mock and test Space key
    mockToggleTheme.mockClear();
    await userEvent.keyboard(' ');
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
}); 