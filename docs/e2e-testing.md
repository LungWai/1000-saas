# End-to-End Testing with Cypress

This guide provides detailed instructions for setting up and implementing end-to-end tests with Cypress for the 1000-SaaS project.

## Table of Contents

1. [Setting Up Cypress](#setting-up-cypress)
2. [Project Structure](#project-structure)
3. [Writing Tests](#writing-tests)
4. [Common Patterns](#common-patterns)
5. [Visual Regression Testing](#visual-regression-testing)
6. [CI/CD Integration](#cicd-integration)
7. [Debugging Tips](#debugging-tips)

## Setting Up Cypress

### Installation

1. Install Cypress and its dependencies:

```bash
pnpm add -D cypress @testing-library/cypress
```

2. Initialize Cypress:

```bash
npx cypress open
```

3. Create a configuration file (`cypress.config.ts`):

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: true,
  screenshotOnRunFailure: true,
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
});
```

4. Add Cypress testing commands to your `package.json`:

```json
"scripts": {
  "cypress:open": "cypress open",
  "cypress:run": "cypress run",
  "test:e2e": "start-server-and-test dev 3000 cypress:run"
}
```

5. Install the `start-server-and-test` package to run the server and tests together:

```bash
pnpm add -D start-server-and-test
```

### Setup Support Files

1. Create a support file for Cypress commands (`cypress/support/e2e.ts`):

```typescript
import '@testing-library/cypress/add-commands';

// Add custom commands here
Cypress.Commands.add('loginByUI', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-cy=email-input]').type(email);
  cy.get('[data-cy=password-input]').type(password);
  cy.get('[data-cy=login-button]').click();
  cy.url().should('not.include', '/login');
});

// Mock API responses
Cypress.Commands.add('mockGridData', () => {
  cy.intercept('GET', '/api/grids', {
    fixture: 'grids.json',
  }).as('getGrids');
});

// Add TypeScript definitions
declare global {
  namespace Cypress {
    interface Chainable {
      loginByUI(email: string, password: string): void;
      mockGridData(): void;
    }
  }
}
```

2. Create fixture data files (`cypress/fixtures/grids.json`):

```json
[
  {
    "id": "1",
    "status": "empty",
    "price": 100,
    "title": "Test Grid 1",
    "description": "This is a test grid"
  },
  {
    "id": "2",
    "status": "leased",
    "price": 200,
    "title": "Test Grid 2",
    "description": "This is another test grid",
    "content": "Sample content"
  }
]
```

## Project Structure

Organize your Cypress tests with a clear structure:

```
cypress/
├── fixtures/
│   ├── grids.json
│   └── users.json
├── e2e/
│   ├── grid/
│   │   ├── navigation.cy.ts
│   │   ├── purchase.cy.ts
│   │   └── edit.cy.ts
│   ├── auth/
│   │   ├── login.cy.ts
│   │   └── register.cy.ts
│   └── home.cy.ts
├── support/
│   ├── e2e.ts
│   └── commands.ts
└── component/
    └── Grid.cy.tsx
```

## Writing Tests

### Grid Navigation Test

```typescript
// cypress/e2e/grid/navigation.cy.ts

describe('Grid Navigation', () => {
  beforeEach(() => {
    // Mock the grid data
    cy.mockGridData();
    
    // Visit the home page
    cy.visit('/');
    
    // Wait for grids to load
    cy.wait('@getGrids');
  });

  it('allows users to navigate through grids with keyboard', () => {
    // Get the first grid
    cy.get('[data-grid-id="1"]').as('firstGrid');
    
    // Focus the first grid
    cy.get('@firstGrid').focus();
    
    // Navigate to the next grid using arrow keys
    cy.focused().type('{rightArrow}');
    
    // The second grid should now be focused
    cy.get('[data-grid-id="2"]').should('have.focus');
    
    // Navigate down
    cy.focused().type('{downArrow}');
    
    // Navigate back up
    cy.focused().type('{upArrow}');
    
    // The second grid should still be focused
    cy.get('[data-grid-id="2"]').should('have.focus');
  });

  it('shows hover state when grid is focused', () => {
    // Get the first grid
    cy.get('[data-grid-id="1"]').as('firstGrid');
    
    // Focus the first grid
    cy.get('@firstGrid').focus();
    
    // Check if it has the hovered class or style
    cy.get('@firstGrid').should('have.attr', 'data-hovered', 'true');
    
    // Check for visual scaling using computed style
    cy.get('@firstGrid').should(($el) => {
      const transform = $el[0].style.transform;
      expect(transform).to.include('scale');
    });
  });
});
```

### Grid Purchase Test

```typescript
// cypress/e2e/grid/purchase.cy.ts

describe('Grid Purchase Flow', () => {
  beforeEach(() => {
    // Mock the grid data
    cy.mockGridData();
    
    // Mock the purchase API
    cy.intercept('POST', '/api/checkout/create-session', {
      statusCode: 200,
      body: {
        sessionId: 'test-session',
        url: '/success?session_id=test-session'
      }
    }).as('createCheckoutSession');
    
    cy.visit('/');
    cy.wait('@getGrids');
  });

  it('opens purchase modal when clicking on available grid', () => {
    // Click on the first grid (which is available)
    cy.get('[data-grid-id="1"]').click();
    
    // Verify the purchase modal opens
    cy.get('h2').contains('Purchase Grid').should('be.visible');
    
    // Modal should show the correct grid details
    cy.get('.modal-content').within(() => {
      cy.contains('Test Grid 1');
      cy.contains('$100');
    });
  });

  it('shows toast notification after selecting a grid', () => {
    // Click on the first grid
    cy.get('[data-grid-id="1"]').click();
    
    // Check if toast notification appears
    cy.get('[role="status"]').should('contain', 'Grid Selected');
  });

  it('completes the checkout process', () => {
    // Click on the first grid
    cy.get('[data-grid-id="1"]').click();
    
    // Click on the checkout button
    cy.get('button').contains('Checkout').click();
    
    // Wait for the checkout API call
    cy.wait('@createCheckoutSession');
    
    // We should be redirected to the success page
    cy.url().should('include', '/success');
    
    // Success page should show confirmation message
    cy.contains('Your purchase was successful');
  });
});
```

### Grid Edit Test

```typescript
// cypress/e2e/grid/edit.cy.ts

describe('Grid Editing', () => {
  beforeEach(() => {
    // Mock the grid data with a leased grid
    cy.intercept('GET', '/api/grids', {
      fixture: 'leased-grid.json',
    }).as('getGrids');
    
    // Mock the edit API
    cy.intercept('PUT', '/api/grids/*/content', {
      statusCode: 200,
      body: { success: true }
    }).as('updateGridContent');
    
    cy.visit('/');
    cy.wait('@getGrids');
  });

  it('opens edit modal for leased grids', () => {
    // Click on the leased grid
    cy.get('[data-grid-id="2"]').click();
    
    // Verify the edit modal opens
    cy.get('h2').contains('Edit Grid').should('be.visible');
  });

  it('submits edit form successfully', () => {
    // Click on the leased grid
    cy.get('[data-grid-id="2"]').click();
    
    // Fill out the edit form
    cy.get('[data-cy=subscription-id]').type('sub_123456');
    cy.get('[data-cy=email]').type('test@example.com');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@updateGridContent');
    
    // Check if success toast appears
    cy.get('[role="status"]').should('contain', 'Grid content updated successfully');
    
    // Modal should be closed
    cy.get('h2').contains('Edit Grid').should('not.exist');
  });
  
  it('shows validation errors for invalid input', () => {
    // Click on the leased grid
    cy.get('[data-grid-id="2"]').click();
    
    // Submit without filling form
    cy.get('button[type="submit"]').click();
    
    // Validation errors should be shown
    cy.contains('Subscription ID is required');
    cy.contains('Email is required');
    
    // Modal should still be open
    cy.get('h2').contains('Edit Grid').should('be.visible');
  });
});
```

## Common Patterns

### Testing Keyboard Accessibility

```typescript
// cypress/e2e/accessibility/keyboard.cy.ts

describe('Keyboard Accessibility', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('allows tab navigation through all interactive elements', () => {
    // Start tabbing through the page
    cy.get('body').tab();
    
    // Each focusable element should receive focus in sequence
    cy.focused().should('have.attr', 'data-cy', 'theme-toggle');
    cy.tab();
    cy.focused().should('have.text', 'About');
    cy.tab();
    cy.focused().should('have.text', 'Contact');
    cy.tab();
    
    // First grid should be focused
    cy.focused().should('have.attr', 'data-grid-id', '1');
    
    // Continue tabbing through all grids
    for (let i = 2; i <= 9; i++) {
      cy.tab();
      cy.focused().should('have.attr', 'data-grid-id', i.toString());
    }
  });

  it('handles escape key to close modals', () => {
    // Open a grid modal
    cy.get('[data-grid-id="1"]').click();
    
    // Modal should be open
    cy.get('[role="dialog"]').should('be.visible');
    
    // Press escape
    cy.get('body').type('{esc}');
    
    // Modal should be closed
    cy.get('[role="dialog"]').should('not.exist');
  });
});
```

### Testing Toast Notifications

```typescript
// cypress/e2e/ui/toast.cy.ts

describe('Toast Notifications', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('shows success toast with correct styling', () => {
    // Create a test button that triggers success toast
    cy.window().then((win) => {
      const button = win.document.createElement('button');
      button.textContent = 'Show Success Toast';
      button.setAttribute('data-cy', 'test-toast-button');
      button.addEventListener('click', () => {
        win.dispatchEvent(new CustomEvent('test:toast', { 
          detail: { type: 'success', message: 'Success message' }
        }));
      });
      win.document.body.appendChild(button);
      
      // Add event listener in window
      win.addEventListener('test:toast', (e: any) => {
        const { type, message } = e.detail;
        const toastNotification = win.document.querySelector('[data-cy="toast-notification"]');
        if (toastNotification) {
          const toastFn = toastNotification[type];
          if (typeof toastFn === 'function') {
            toastFn(message);
          }
        }
      });
    });
    
    // Click the test button
    cy.get('[data-cy=test-toast-button]').click();
    
    // Toast should appear with success styling
    cy.get('[role="status"]').should('contain', 'Success message');
    cy.get('[role="status"]').should('have.class', 'bg-green-50');
    
    // Toast should auto-dismiss
    cy.wait(3500); // Wait for longer than the dismiss time
    cy.get('[role="status"]').should('not.exist');
  });
});
```

## Visual Regression Testing

For visual testing, you can use Cypress's built-in screenshot capabilities or add a plugin like `cypress-image-snapshot`.

### Setup

1. Install the plugin:

```bash
pnpm add -D cypress-image-snapshot
```

2. Add to `cypress/support/e2e.ts`:

```typescript
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand({
  failureThreshold: 0.03, // threshold for entire image
  failureThresholdType: 'percent', // percent of image or number of pixels
  customDiffConfig: { threshold: 0.1 }, // threshold for each pixel
  capture: 'viewport', // capture viewport or fullPage
});
```

3. Add to `cypress.config.ts`:

```typescript
import { defineConfig } from 'cypress';
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      addMatchImageSnapshotPlugin(on, config);
    },
    // other config...
  },
});
```

### Writing Visual Tests

```typescript
// cypress/e2e/visual/grid-appearance.cy.ts

describe('Grid Visual Appearance', () => {
  beforeEach(() => {
    cy.mockGridData();
    cy.visit('/');
    cy.wait('@getGrids');
  });

  it('matches grid layout snapshot', () => {
    // Allow time for any animations to complete
    cy.wait(500);
    
    // Take a snapshot of the grid container
    cy.get('.grid-container').matchImageSnapshot('grid-container');
  });

  it('matches hover state snapshot', () => {
    // Hover over the first grid
    cy.get('[data-grid-id="1"]').trigger('mouseover');
    
    // Allow time for hover animation
    cy.wait(300);
    
    // Take a snapshot of the hovered grid
    cy.get('[data-grid-id="1"]').matchImageSnapshot('grid-hover-state');
  });

  it('matches purchase modal snapshot', () => {
    // Open purchase modal
    cy.get('[data-grid-id="1"]').click();
    
    // Allow time for modal animation
    cy.wait(300);
    
    // Take a snapshot of the modal
    cy.get('[role="dialog"]').matchImageSnapshot('purchase-modal');
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  cypress:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build Next.js
        run: pnpm build
        
      - name: Cypress run
        uses: cypress-io/github-action@v5
        with:
          build: pnpm build
          start: pnpm start
          wait-on: 'http://localhost:3000'
          browser: chrome
          record: true
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots
          
      - name: Upload videos
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: cypress-videos
          path: cypress/videos
```

## Debugging Tips

### Interactive Debugging

When running Cypress in interactive mode:

1. Use `.debug()` to pause test execution:

```typescript
cy.get('[data-grid-id="1"]').debug().click();
```

2. Use `cy.pause()` to pause execution:

```typescript
cy.pause();
cy.get('[data-grid-id="1"]').click();
```

### Common Issues and Solutions

1. **Element Not Found**: If Cypress can't find an element, try:
   - Adding a longer wait time: `cy.wait(1000)`
   - Using more specific selectors
   - Using `cy.contains()` with more specific text

2. **Animations Interfering**: If animations are causing issues:
   - Add wait time after animations: `cy.wait(300)`
   - Disable animations in test environment

3. **API Mocking Issues**: If API mocks aren't working:
   - Check intercept path patterns
   - Verify the response format matches what the app expects
   - Use `cy.wait('@aliasName')` to ensure the intercept happens

4. **Visual Testing Failures**: If visual tests are failing:
   - Adjust the threshold for differences
   - Take new baseline screenshots when intentional UI changes are made
   - Consider using Percy or Applitools for more robust visual testing 