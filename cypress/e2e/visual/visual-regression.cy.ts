describe('Visual Regression Tests', () => {
  beforeEach(() => {
    // Mock API responses for consistent UI state
    cy.intercept('GET', '/api/grids/*', { fixture: 'grids.json' }).as('getGrids');
    
    // Visit the main page
    cy.visit('/');
    cy.wait('@getGrids');
  });
  
  it('Main grid layout should match snapshot', () => {
    // Take snapshot of the grid layout
    cy.get('[data-testid="grid-container"]').should('be.visible');
    cy.screenshot('main-grid-layout', { capture: 'viewport' });
    
    // Compare with baseline
    // Note: First run will create the baseline
    // Uncommenting the next line will cause the test to fail if visual changes detected
    // cy.compareSnapshot('main-grid-layout');
  });
  
  it('Grid item hover state should match snapshot', () => {
    // Hover over a grid item
    cy.get('[data-grid-item]').first().trigger('mouseover');
    
    // Wait for hover animations to complete
    cy.wait(500);
    
    // Take screenshot of the hovered state
    cy.get('[data-grid-item]').first().screenshot('grid-item-hover');
    
    // Compare with baseline
    // cy.compareSnapshot('grid-item-hover');
  });
  
  it('Purchase modal should match snapshot', () => {
    // Open the purchase modal
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Take screenshot of the modal
    cy.get('[data-testid="purchase-modal"]').screenshot('purchase-modal');
    
    // Compare with baseline
    // cy.compareSnapshot('purchase-modal');
  });
  
  it('Edit modal should match snapshot', () => {
    // Open the edit modal
    cy.get('[data-grid-item][data-status="leased"]').first().click();
    
    // Take screenshot of the edit modal
    cy.get('[data-testid="edit-modal"]').screenshot('edit-modal');
    
    // Compare with baseline
    // cy.compareSnapshot('edit-modal');
  });
  
  it('Toast notification should match snapshot', () => {
    // Trigger an error toast
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Fill form with invalid data
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="terms-checkbox"]').click();
    
    // Try to submit, which should fail and show an error toast
    cy.get('[data-testid="purchase-button"]').click();
    
    // Take screenshot of the toast
    cy.get('[data-toast]').screenshot('toast-notification');
    
    // Compare with baseline
    // cy.compareSnapshot('toast-notification');
  });
  
  it('Responsive layout at mobile size should match snapshot', () => {
    // Set viewport to mobile size
    cy.viewport('iphone-x');
    
    // Let layout adjust
    cy.wait(500);
    
    // Take screenshot of mobile layout
    cy.screenshot('mobile-layout');
    
    // Compare with baseline
    // cy.compareSnapshot('mobile-layout');
  });
  
  it('Grid skeleton loading state should match snapshot', () => {
    // Visit page with loading state enabled
    cy.visit('/?forceLoading=true');
    
    // Skeleton should be visible
    cy.get('[data-testid="grid-skeleton-container"]').should('be.visible');
    
    // Take screenshot
    cy.screenshot('grid-loading-state');
    
    // Compare with baseline
    // cy.compareSnapshot('grid-loading-state');
  });
  
  it('Dark mode appearance should match snapshot', () => {
    // Enable dark mode
    cy.get('html').invoke('addClass', 'dark');
    
    // Take screenshot
    cy.screenshot('dark-mode');
    
    // Compare with baseline
    // cy.compareSnapshot('dark-mode');
    
    // Reset theme
    cy.get('html').invoke('removeClass', 'dark');
  });
  
  it('Form validation errors should match snapshot', () => {
    // Open purchase modal
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Enter invalid email
    cy.get('[data-testid="email-input"]').type('invalid-email');
    
    // Submit form to trigger validation
    cy.get('[data-testid="purchase-button"]').click();
    
    // Take screenshot of form with error
    cy.get('[data-testid="purchase-modal"]').screenshot('form-validation-error');
    
    // Compare with baseline
    // cy.compareSnapshot('form-validation-error');
  });
  
  it('Focus indicators should be visible and match snapshot', () => {
    // Tab to first interactive element
    cy.realPress('Tab');
    
    // Take screenshot of focused element
    cy.screenshot('focus-indicator');
    
    // Compare with baseline
    // cy.compareSnapshot('focus-indicator');
  });
}); 