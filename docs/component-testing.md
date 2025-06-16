# Component Testing Guide

This guide provides specific instructions for testing components in the 1000-SaaS project.

## Table of Contents

1. [Testing UI Components](#testing-ui-components)
2. [Testing Custom Hooks](#testing-custom-hooks)
3. [Testing Grid Components](#testing-grid-components)
4. [Mocking API Calls](#mocking-api-calls)
5. [Test Examples](#test-examples)

## Testing UI Components

### Button Component Test

```tsx
// src/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button Component', () => {
  it('renders with the correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies the correct variant class', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Toast Component Test

```tsx
// src/components/ui/toast.test.tsx
import { render, screen } from '@testing-library/react';
import { Toast, ToastTitle, ToastDescription } from './toast';

describe('Toast Component', () => {
  it('renders with title and description', () => {
    render(
      <Toast>
        <ToastTitle>Success</ToastTitle>
        <ToastDescription>Operation completed</ToastDescription>
      </Toast>
    );
    
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('applies variant styling', () => {
    render(
      <Toast variant="destructive">
        <ToastTitle>Error</ToastTitle>
      </Toast>
    );
    
    const toast = screen.getByText('Error').closest('div[role]');
    expect(toast).toHaveClass('destructive');
  });
});
```

## Testing Custom Hooks

### useToastNotification Hook Test

```tsx
// src/hooks/useToastNotification.test.ts
import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import useToastNotification from './useToastNotification';

// Mock the useToast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn().mockReturnValue({ id: 'test-id' }),
    dismiss: jest.fn(),
  }),
}));

describe('useToastNotification', () => {
  it('provides all notification functions', () => {
    const { result } = renderHook(() => useToastNotification());
    
    expect(typeof result.current.showSuccess).toBe('function');
    expect(typeof result.current.showError).toBe('function');
    expect(typeof result.current.showInfo).toBe('function');
    expect(typeof result.current.showWarning).toBe('function');
    expect(typeof result.current.showLoading).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
  });

  it('calls toast with correct parameters for success', () => {
    const { result } = renderHook(() => useToastNotification());
    const mockToast = jest.spyOn(result.current, 'showSuccess');
    
    act(() => {
      result.current.showSuccess('Test success message');
    });
    
    expect(mockToast).toHaveBeenCalledWith('Test success message', undefined);
  });
});
```

### useGrids Hook Test

```tsx
// src/hooks/useGrids.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useGrids } from './useGrids';

// Mock fetch calls
global.fetch = jest.fn();

const mockGridsResponse = [
  { id: '1', status: 'empty', price: 100 },
  { id: '2', status: 'leased', price: 200 },
];

describe('useGrids', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockGridsResponse,
    });
  });

  it('fetches grids on initial render', async () => {
    const { result } = renderHook(() => useGrids());
    
    // Initially loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.grids).toEqual(mockGridsResponse);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles API errors correctly', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API error'));
    
    const { result } = renderHook(() => useGrids());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('API error');
  });
});
```

## Testing Grid Components

### Grid Component Test

```tsx
// src/components/Grid.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Grid from './Grid';

// Mock the PurchaseModal component
jest.mock('./PurchaseModal', () => {
  return function MockPurchaseModal({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="purchase-modal">
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

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
```

### GridContainer Component Test

```tsx
// src/components/GridContainer.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GridContainer from './GridContainer';

// Mock the GridItem component
jest.mock('./GridItem', () => {
  return function MockGridItem({ id, status, onKeyboardNavigation, onPurchaseClick }: any) {
    return (
      <div 
        data-testid={`grid-${id}`}
        data-status={status}
        tabIndex={0}
        role="button"
        onClick={() => onPurchaseClick(id)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' && onKeyboardNavigation) {
            onKeyboardNavigation('right', id);
          }
        }}
      >
        Grid {id}
      </div>
    );
  };
});

describe('GridContainer Component', () => {
  const mockGrids = [
    { id: '1', status: 'empty', price: 100 },
    { id: '2', status: 'leased', price: 200 },
  ];

  it('renders the correct number of grids', () => {
    render(
      <GridContainer 
        grids={mockGrids} 
        containerSize={2} 
        columns={2}
        onPurchaseClick={jest.fn()}
      />
    );
    
    expect(screen.getByTestId('grid-1')).toBeInTheDocument();
    expect(screen.getByTestId('grid-2')).toBeInTheDocument();
  });

  it('calls onPurchaseClick when a grid is clicked', async () => {
    const mockPurchaseClick = jest.fn();
    render(
      <GridContainer 
        grids={mockGrids} 
        containerSize={2} 
        columns={2}
        onPurchaseClick={mockPurchaseClick}
      />
    );
    
    await userEvent.click(screen.getByTestId('grid-1'));
    expect(mockPurchaseClick).toHaveBeenCalledWith('1');
  });
});
```

## Mocking API Calls

### Using Mock Service Worker (MSW)

```tsx
// src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/grids', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: '1', status: 'empty', price: 100 },
        { id: '2', status: 'leased', price: 200 },
      ])
    );
  }),
  
  rest.put('/api/grids/:id/content', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({ success: true, id })
    );
  }),
];

// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/setupTests.ts
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Test Examples

### Toast Notification Integration Test

```tsx
// src/components/GridItem.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GridItem from './GridItem';
import { ToastProvider } from '@/components/ui/toast';

// Mock API call
global.fetch = jest.fn();

describe('GridItem with Toast Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('shows success toast when edit is successful', async () => {
    render(
      <ToastProvider>
        <GridItem 
          id="1"
          status="leased"
          price={100}
          onPurchaseClick={jest.fn()}
        />
      </ToastProvider>
    );
    
    // Trigger edit
    await userEvent.click(screen.getByRole('button'));
    
    // Fill in form and submit (simplified for test)
    // ...
    
    // Verify toast appears
    await waitFor(() => {
      expect(screen.getByText('Grid content updated successfully!')).toBeInTheDocument();
    });
  });
});
```

### Keyboard Navigation Test

```tsx
// src/components/Grid.keyboard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Grid from './Grid';

describe('Grid Keyboard Navigation', () => {
  const mockGrid = {
    id: '1',
    content: null,
    customerId: null,
    // ... other required properties
  };

  it('can be focused with Tab key', async () => {
    render(<Grid grid={mockGrid} tabIndex={0} />);
    
    // Press Tab to focus the grid
    await userEvent.tab();
    
    const gridElement = screen.getByRole('button');
    expect(gridElement).toHaveFocus();
  });

  it('activates on Enter key press', async () => {
    const mockClick = jest.fn();
    render(<Grid grid={mockGrid} onClick={mockClick} tabIndex={0} />);
    
    // Focus and press Enter
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('activates on Space key press', async () => {
    const mockClick = jest.fn();
    render(<Grid grid={mockGrid} onClick={mockClick} tabIndex={0} />);
    
    // Focus and press Space
    await userEvent.tab();
    await userEvent.keyboard(' ');
    
    expect(mockClick).toHaveBeenCalledTimes(1);
  });
});
``` 