describe('Keyboard Accessibility', () => {
  beforeEach(() => {
    cy.mockGridData();
    cy.visit('/');
    cy.wait('@getGrids');
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

  it('allows keyboard interaction with grid', () => {
    // Focus the grid with tab key
    cy.get('body').tab();

    // Tab through focusable elements until we reach a grid
    cy.focused().tab().tab().tab();
    
    // Check if a grid is focused
    cy.focused().should('have.attr', 'data-grid-id');
    
    // Press Enter to activate
    cy.focused().type('{enter}');
    
    // Modal should be visible
    cy.get('[role="dialog"]').should('be.visible');
  });
}); 