import { render, screen } from '@testing-library/react';
import Skeleton from '../ui/Skeleton';

describe('Skeleton Component', () => {
  it('renders with default styling', () => {
    render(<Skeleton data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('bg-muted');
    expect(skeleton).toHaveClass('rounded-md');
  });
  
  it('renders with custom width and height', () => {
    render(<Skeleton width={200} height={100} data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle('width: 200px');
    expect(skeleton).toHaveStyle('height: 100px');
  });
  
  it('renders with percentage width and height', () => {
    render(<Skeleton width="50%" height="25%" data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle('width: 50%');
    expect(skeleton).toHaveStyle('height: 25%');
  });
  
  it('renders with custom className', () => {
    render(<Skeleton className="custom-class" data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('custom-class');
    // Should still have default classes
    expect(skeleton).toHaveClass('animate-pulse');
  });
  
  it('applies borderRadius correctly', () => {
    render(<Skeleton borderRadius="9999px" data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle('border-radius: 9999px');
  });
  
  it('renders a circle skeleton when isCircle is true', () => {
    render(<Skeleton isCircle size={50} data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle('width: 50px');
    expect(skeleton).toHaveStyle('height: 50px');
    expect(skeleton).toHaveStyle('border-radius: 9999px');
  });
  
  it('renders children inside the skeleton', () => {
    render(
      <Skeleton data-testid="skeleton">
        <div data-testid="child">Child content</div>
      </Skeleton>
    );
    
    const skeleton = screen.getByTestId('skeleton');
    const child = screen.getByTestId('child');
    
    expect(skeleton).toBeInTheDocument();
    expect(child).toBeInTheDocument();
    expect(child.textContent).toBe('Child content');
  });
  
  it('disables animation when specified', () => {
    render(<Skeleton animate={false} data-testid="skeleton" />);
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).not.toHaveClass('animate-pulse');
  });
  
  it('accepts a custom testId', () => {
    render(<Skeleton testId="custom-skeleton" />);
    
    const skeleton = screen.getByTestId('custom-skeleton');
    expect(skeleton).toBeInTheDocument();
  });
  
  it('renders correctly with all props combined', () => {
    render(
      <Skeleton 
        width={150} 
        height={75} 
        className="custom-class" 
        borderRadius="8px" 
        animate={false}
        data-testid="skeleton"
      />
    );
    
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle('width: 150px');
    expect(skeleton).toHaveStyle('height: 75px');
    expect(skeleton).toHaveStyle('border-radius: 8px');
    expect(skeleton).toHaveClass('custom-class');
    expect(skeleton).not.toHaveClass('animate-pulse');
  });
}); 