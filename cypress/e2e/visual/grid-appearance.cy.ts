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
    cy.get('.grid').matchImageSnapshot('grid-container');
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