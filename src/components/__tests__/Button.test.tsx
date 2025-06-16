import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('inline-flex');
  });
  
  it('renders as different variants', () => {
    render(
      <>
        <Button variant="default" data-testid="default">Default</Button>
        <Button variant="destructive" data-testid="destructive">Destructive</Button>
        <Button variant="outline" data-testid="outline">Outline</Button>
        <Button variant="secondary" data-testid="secondary">Secondary</Button>
        <Button variant="ghost" data-testid="ghost">Ghost</Button>
        <Button variant="link" data-testid="link">Link</Button>
      </>
    );
    
    // Check that each variant has the correct class
    expect(screen.getByTestId('default')).toHaveClass('bg-primary');
    expect(screen.getByTestId('destructive')).toHaveClass('bg-destructive');
    expect(screen.getByTestId('outline')).toHaveClass('border');
    expect(screen.getByTestId('secondary')).toHaveClass('bg-secondary');
    expect(screen.getByTestId('ghost')).toHaveClass('hover:bg-accent');
    expect(screen.getByTestId('link')).toHaveClass('text-primary');
  });
  
  it('renders in different sizes', () => {
    render(
      <>
        <Button size="default" data-testid="default">Default</Button>
        <Button size="sm" data-testid="small">Small</Button>
        <Button size="lg" data-testid="large">Large</Button>
        <Button size="icon" data-testid="icon">I</Button>
      </>
    );
    
    // Check size classes
    expect(screen.getByTestId('default')).toHaveClass('h-10 px-4 py-2');
    expect(screen.getByTestId('small')).toHaveClass('h-9 px-3');
    expect(screen.getByTestId('large')).toHaveClass('h-11 px-8');
    expect(screen.getByTestId('icon')).toHaveClass('h-10 w-10');
  });
  
  it('handles clicks correctly', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('can be disabled', async () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDisabled();
    
    // Click should not trigger the handler
    await userEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('renders with custom className', () => {
    render(<Button className="custom-class">Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('custom-class');
  });
  
  it('forwards ref correctly', () => {
    const ref = jest.fn();
    render(<Button ref={ref}>Click me</Button>);
    
    expect(ref).toHaveBeenCalled();
  });
}); 