describe('Purchase and Checkout Flow', () => {
  beforeEach(() => {
    // Mock API responses
    cy.intercept('GET', '/api/grids/*', { fixture: 'grids.json' }).as('getGrids');
    
    // Mock the checkout API
    cy.intercept('POST', '/api/checkout/create-session', {
      statusCode: 200,
      body: { 
        url: 'https://checkout.stripe.test/test-session' 
      }
    }).as('createCheckoutSession');
    
    // Visit the main page
    cy.visit('/');
    cy.wait('@getGrids');
  });
  
  it('opens purchase modal when clicking on an empty grid', () => {
    // Find an empty grid and click it
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Purchase modal should appear
    cy.get('[data-testid="purchase-modal"]').should('be.visible');
    cy.get('[data-testid="purchase-modal"]').contains('Purchase Grid');
  });
  
  it('shows correct grid price in purchase modal', () => {
    // Find an empty grid with a specific price
    cy.get('[data-grid-item][data-status="empty"][data-price="100"]').first().click();
    
    // Price should be displayed in the modal
    cy.get('[data-testid="purchase-modal"]').contains('$100');
  });
  
  it('validates email format in purchase form', () => {
    // Open purchase modal
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Type invalid email
    cy.get('[data-testid="email-input"]').type('invalid-email');
    
    // Focus away to trigger validation
    cy.get('[data-testid="terms-checkbox"]').click();
    
    // Error message should appear
    cy.get('[data-testid="email-error"]').should('be.visible');
    cy.get('[data-testid="email-error"]').contains('valid email');
    
    // Submit button should be disabled
    cy.get('[data-testid="purchase-button"]').should('be.disabled');
  });
  
  it('requires agreement to terms before purchase', () => {
    // Open purchase modal
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Type valid email
    cy.get('[data-testid="email-input"]').type('test@example.com');
    
    // Submit button should still be disabled without terms
    cy.get('[data-testid="purchase-button"]').should('be.disabled');
    
    // Check terms
    cy.get('[data-testid="terms-checkbox"]').click();
    
    // Submit button should be enabled
    cy.get('[data-testid="purchase-button"]').should('be.enabled');
  });
  
  it('closes purchase modal when cancel button is clicked', () => {
    // Open purchase modal
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Click cancel button
    cy.get('[data-testid="cancel-button"]').click();
    
    // Modal should be closed
    cy.get('[data-testid="purchase-modal"]').should('not.exist');
  });
  
  it('submits purchase form correctly', () => {
    // Get grid id from the first empty grid
    let gridId;
    cy.get('[data-grid-item][data-status="empty"]').first()
      .invoke('attr', 'data-grid-id')
      .then(id => {
        gridId = id;
        
        // Open purchase modal for this grid
        cy.get(`[data-grid-id="${gridId}"]`).click();
        
        // Fill out the form
        cy.get('[data-testid="email-input"]').type('test@example.com');
        cy.get('[data-testid="terms-checkbox"]').click();
        
        // Submit form
        cy.get('[data-testid="purchase-button"]').click();
        
        // Check API was called with correct data
        cy.wait('@createCheckoutSession').its('request.body').should('deep.equal', {
          email: 'test@example.com',
          gridId: gridId
        });
      });
  });
  
  it('shows loading toast during checkout process', () => {
    // Slow down the API response to see loading state
    cy.intercept('POST', '/api/checkout/create-session', req => {
      req.on('response', res => {
        // Delay the response by 500ms
        res.setDelay(500);
      });
      
      // Return success response after delay
      req.reply({
        statusCode: 200,
        body: { url: 'https://checkout.stripe.test/test-session' }
      });
    }).as('slowCheckout');
    
    // Open purchase modal
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Fill out the form
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="terms-checkbox"]').click();
    
    // Submit form
    cy.get('[data-testid="purchase-button"]').click();
    
    // Loading toast should appear
    cy.get('[data-toast][data-variant="loading"]').should('be.visible');
    cy.get('[data-toast][data-variant="loading"]').contains('Processing');
  });
  
  it('redirects to Stripe checkout on successful submission', () => {
    // Spy on window.location.assign
    const assignSpy = cy.spy(window.location, 'assign').as('locationAssign');
    
    // Open purchase modal
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Fill out the form
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="terms-checkbox"]').click();
    
    // Submit form
    cy.get('[data-testid="purchase-button"]').click();
    
    // Verify redirect
    cy.get('@locationAssign').should('have.been.calledWith', 'https://checkout.stripe.test/test-session');
  });
  
  it('shows error toast when API call fails', () => {
    // Mock a failed API call
    cy.intercept('POST', '/api/checkout/create-session', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('failedCheckout');
    
    // Open purchase modal
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Fill out the form
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="terms-checkbox"]').click();
    
    // Submit form
    cy.get('[data-testid="purchase-button"]').click();
    
    // Wait for failed request
    cy.wait('@failedCheckout');
    
    // Error toast should appear
    cy.get('[data-toast][data-variant="destructive"]').should('be.visible');
    cy.get('[data-toast][data-variant="destructive"]').contains('Failed to process purchase');
  });
  
  it('handles network errors during checkout', () => {
    // Mock a network error
    cy.intercept('POST', '/api/checkout/create-session', {
      forceNetworkError: true
    }).as('networkError');
    
    // Open purchase modal
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Fill out the form
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="terms-checkbox"]').click();
    
    // Submit form
    cy.get('[data-testid="purchase-button"]').click();
    
    // Error toast should appear
    cy.get('[data-toast][data-variant="destructive"]').should('be.visible');
  });
  
  it('purchase modal is keyboard accessible', () => {
    // Open purchase modal
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Modal should receive focus
    cy.focused().should('exist').and('have.attr', 'role', 'dialog');
    
    // Tab to email field
    cy.focused().tab();
    cy.focused().should('have.attr', 'name', 'email');
    
    // Tab to terms checkbox
    cy.focused().tab();
    cy.focused().should('have.attr', 'type', 'checkbox');
    
    // Tab to cancel button
    cy.focused().tab();
    cy.focused().should('have.text', 'Cancel');
    
    // Tab to purchase button
    cy.focused().tab();
    cy.focused().should('have.text', 'Purchase');
    
    // Purchase button should be disabled initially
    cy.get('[data-testid="purchase-button"]').should('be.disabled');
    
    // Go back to email and fill it
    cy.focused().tab({ shift: true }).tab({ shift: true }).tab({ shift: true });
    cy.focused().should('have.attr', 'name', 'email');
    cy.focused().type('test@example.com');
    
    // Tab to terms and check it
    cy.focused().tab();
    cy.focused().should('have.attr', 'type', 'checkbox');
    cy.focused().type(' '); // Space to check checkbox
    
    // Tab to purchase button
    cy.focused().tab().tab();
    cy.focused().should('have.text', 'Purchase');
    
    // Button should now be enabled
    cy.get('[data-testid="purchase-button"]').should('be.enabled');
  });
  
  it('closes purchase modal with Escape key', () => {
    // Open purchase modal
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Press Escape
    cy.get('body').type('{esc}');
    
    // Modal should be closed
    cy.get('[data-testid="purchase-modal"]').should('not.exist');
  });
}); 