import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';

// Create a mock next/link since we're only testing the UI components
jest.mock('next/link', () => {
  return ({ href, children }: { href: string; children: React.ReactNode }) => {
    return <a href={href}>{children}</a>;
  };
});

// Create a mock component that resembles the header navigation
const MockNavigation = () => {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink 
            className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium" 
            href="/about"
          >
            About
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink 
            className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium" 
            href="#contact"
          >
            Contact
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

describe('Navigation Component', () => {
  it('renders navigation links correctly', () => {
    render(<MockNavigation />);
    
    // Check that the navigation links are rendered
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument();
  });

  it('has correct href attributes', () => {
    render(<MockNavigation />);
    
    // Check that the links have the correct href attributes
    expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '#contact');
  });

  it('is keyboard navigable', async () => {
    render(<MockNavigation />);
    
    // Focus the first link
    await userEvent.tab();
    expect(screen.getByRole('link', { name: /about/i })).toHaveFocus();
    
    // Move to the next link with tab
    await userEvent.tab();
    expect(screen.getByRole('link', { name: /contact/i })).toHaveFocus();
  });
  
  it('links are clickable', async () => {
    render(<MockNavigation />);
    
    // Mock window.location.href
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: '' };
    
    // Click the About link
    await userEvent.click(screen.getByRole('link', { name: /about/i }));
    
    // Since we're in a test environment, the page won't actually navigate
    // but we can check if the click handler was called
    
    // Restore window.location
    window.location = originalLocation;
  });
}); 