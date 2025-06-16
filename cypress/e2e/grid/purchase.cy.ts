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
    cy.get('[role="dialog"]').within(() => {
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