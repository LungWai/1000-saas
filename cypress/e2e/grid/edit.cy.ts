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