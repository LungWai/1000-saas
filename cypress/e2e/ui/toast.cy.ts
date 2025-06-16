describe('Toast Notifications', () => {
  beforeEach(() => {
    cy.mockGridData();
    cy.visit('/');
    cy.wait('@getGrids');
  });

  it('shows toast notification when selecting a grid', () => {
    // Click a grid to trigger toast
    cy.get('[data-grid-id="1"]').click();
    
    // Toast should appear with correct message
    cy.get('[role="status"]').should('be.visible');
    cy.get('[role="status"]').should('contain', 'Grid Selected');
    
    // Toast should have title
    cy.get('[role="status"]').find('div').first().should('contain', 'Grid Selected');
    
    // Toast should have the right styling
    cy.get('[role="status"]').should('have.css', 'background-color');
    
    // Toast should auto-dismiss after some time
    cy.wait(5000); // Wait for toast to dismiss
    cy.get('[role="status"]').should('not.exist');
  });

  it('shows error toast when API call fails', () => {
    // Mock a failed API response
    cy.intercept('POST', '/api/checkout/create-session', {
      statusCode: 500,
      body: {
        error: 'Server error'
      }
    }).as('failedCheckout');
    
    // Click on a grid
    cy.get('[data-grid-id="1"]').click();
    
    // Click checkout to trigger error
    cy.get('button').contains('Checkout').click();
    
    // Wait for the failed request
    cy.wait('@failedCheckout');
    
    // Error toast should appear
    cy.get('[role="alert"]').should('be.visible');
    cy.get('[role="alert"]').should('contain', 'Error');
  });
}); 