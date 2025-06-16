# Test Execution Guide

This document provides instructions for running the various tests that have been set up for the 1000-SaaS project.

## Running Unit Tests

Unit tests are implemented using Jest and React Testing Library. These tests focus on individual components and functions.

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

### Current Unit Test Coverage

The following components and hooks have unit tests:

1. UI Components:
   - Button component
   - Skeleton component 
   - GridSkeleton component
   - GridItem component
   - GridContainer component
   - PurchaseModal component
   - EditModal component

2. Custom Hooks:
   - useToastNotification hook

3. API Routes:
   - Grid content API (/api/grids/[id]/content)
   - Verify access API (/api/grids/verify-access)
   - Checkout API (/api/checkout/create-session)

## Running End-to-End Tests

End-to-End tests are implemented using Cypress. These tests simulate user behavior and test complete user flows.

```bash
# Run Cypress tests in interactive mode
pnpm cypress:open

# Run all Cypress tests in headless mode
pnpm cypress:run

# Run only E2E tests
pnpm cypress:e2e

# Run only accessibility tests
pnpm cypress:a11y

# Run only visual regression tests
pnpm cypress:visual

# Run component tests
pnpm cypress:component

# Run all tests (unit and E2E)
pnpm test:all
```

### Current E2E Test Coverage

The following user flows have E2E tests:

1. Grid Navigation:
   - Standard navigation between grids
   - Keyboard navigation (arrow keys, Home/End, PageUp/PageDown)
   - Focus and hover states

2. Purchase Flow:
   - Opening purchase modal
   - Form validation (email, terms)
   - API interaction (success and error handling)
   - Toast notifications
   - Keyboard accessibility
   - Completing checkout process

3. Grid Editing:
   - Opening edit modal
   - Form validation
   - Image upload and preview
   - Submission handling
   - Error handling

4. Accessibility:
   - WCAG compliance checks
   - Keyboard navigation
   - Focus management
   - Modal interactions
   - Skip links
   - Color contrast
   - ARIA attributes

5. UI Components:
   - Toast notifications
   - Button states
   - Form inputs
   - Modals
   - Skeleton loaders

6. Visual Regression:
   - Grid layout
   - Hover and focus states
   - Modal appearance
   - Responsive layouts
   - Dark mode appearance
   - Form validation states

## CI/CD Integration

Tests are automatically run in the CI/CD pipeline through GitHub Actions:

1. Unit tests run on every pull request and push to main
2. E2E tests run after unit tests on main branch merges

The GitHub Actions workflow configuration is in `.github/workflows/test.yml`.

## Troubleshooting

### Common Issues with Unit Tests

- **Missing Dependencies**: Make sure all dependencies are installed with `pnpm install`
- **Mock Issues**: Some tests may fail if mocks are not set up correctly. Check the mock implementations in the test files.

### Common Issues with E2E Tests

- **Server Not Running**: The Cypress tests require the Next.js server to be running. Start it with `pnpm dev`
- **Hydration Errors**: Next.js hydration errors may occur during testing. These are often related to server-side rendering vs. client-side rendering differences.
- **Timing Issues**: Some tests may fail due to timing issues. Try increasing wait times or adding more robust waiting conditions.

## Next Steps for Testing

1. **Increase Coverage**: Add more unit tests for uncovered components
2. **API Mocking**: Improve API mocking in E2E tests
3. **Accessibility Testing**: Add more comprehensive accessibility tests
4. **Performance Testing**: Implement performance testing for critical user flows 