import { render, screen } from '@testing-library/react';
import GridSkeleton from '../GridSkeleton';

// Mock the Skeleton component to simplify testing
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('GridSkeleton Component', () => {
  it('renders the correct number of skeleton items', () => {
    render(<GridSkeleton count={5} />);
    
    const skeletonItems = screen.getAllByTestId('grid-skeleton-item');
    expect(skeletonItems).toHaveLength(5);
  });
  
  it('renders with default count when not specified', () => {
    render(<GridSkeleton />);
    
    // Default count should be 9
    const skeletonItems = screen.getAllByTestId('grid-skeleton-item');
    expect(skeletonItems).toHaveLength(9);
  });
  
  it('renders with container styling', () => {
    render(<GridSkeleton count={4} />);
    
    // Container should have grid styling
    const container = screen.getByTestId('grid-skeleton-container');
    expect(container).toHaveClass('grid');
    expect(container).toHaveClass('gap-4');
  });
  
  it('applies the correct aspect ratio to skeleton items', () => {
    render(<GridSkeleton count={3} />);
    
    const skeletonItems = screen.getAllByTestId('grid-skeleton-item');
    
    // Each skeleton item should have the correct aspect ratio class
    skeletonItems.forEach(item => {
      expect(item).toHaveClass('aspect-square');
    });
  });
  
  it('applies responsive grid columns', () => {
    render(<GridSkeleton count={6} />);
    
    const container = screen.getByTestId('grid-skeleton-container');
    
    // These classes represent responsive grid columns
    expect(container).toHaveClass('grid-cols-2');
    expect(container).toHaveClass('sm:grid-cols-3');
    expect(container).toHaveClass('md:grid-cols-4');
    expect(container).toHaveClass('lg:grid-cols-5');
    expect(container).toHaveClass('xl:grid-cols-6');
  });
  
  it('can override default columns with props', () => {
    render(
      <GridSkeleton 
        count={4} 
        columns={{
          default: 1,
          sm: 2,
          md: 3,
          lg: 4,
          xl: 5
        }}
      />
    );
    
    const container = screen.getByTestId('grid-skeleton-container');
    
    // Should have the specified column classes
    expect(container).toHaveClass('grid-cols-1');
    expect(container).toHaveClass('sm:grid-cols-2');
    expect(container).toHaveClass('md:grid-cols-3');
    expect(container).toHaveClass('lg:grid-cols-4');
    expect(container).toHaveClass('xl:grid-cols-5');
  });
  
  it('renders with custom gap', () => {
    render(<GridSkeleton count={3} gap={8} />);
    
    const container = screen.getByTestId('grid-skeleton-container');
    expect(container).toHaveClass('gap-8');
  });
  
  it('passes animation prop to skeleton items', () => {
    render(<GridSkeleton count={3} animate={false} />);
    
    const skeletonItems = screen.getAllByTestId('grid-skeleton-item');
    
    // None of the items should have the animation class
    skeletonItems.forEach(item => {
      expect(item).not.toHaveClass('animate-pulse');
    });
  });
  
  it('adds custom class names to the container', () => {
    render(<GridSkeleton count={2} className="custom-class test-class" />);
    
    const container = screen.getByTestId('grid-skeleton-container');
    expect(container).toHaveClass('custom-class');
    expect(container).toHaveClass('test-class');
  });
  
  it('renders items with rounded corners', () => {
    render(<GridSkeleton count={3} />);
    
    const skeletonItems = screen.getAllByTestId('grid-skeleton-item');
    
    // Each item should have rounded corners
    skeletonItems.forEach(item => {
      expect(item).toHaveClass('rounded-md');
    });
  });
}); 