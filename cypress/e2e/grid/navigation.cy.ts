describe('Grid Keyboard Navigation', () => {
  beforeEach(() => {
    // Visit the main page with grids
    cy.visit('/');
    
    // Wait for grids to load - assuming some loading state indicator
    cy.get('[data-loading="false"]').should('exist');
  });
  
  it('should navigate between grids using arrow keys', () => {
    // Find the first grid and focus it
    cy.get('[data-grid-item]').first().focus();
    
    // Check that it has focus
    cy.focused().should('have.attr', 'data-grid-item');
    
    // Press right arrow to move to next grid
    cy.focused().type('{rightarrow}');
    
    // Check that the next grid is focused
    cy.focused().should('have.attr', 'data-grid-item');
    cy.focused().should('not.equal', cy.get('[data-grid-item]').first());
    
    // Press down arrow to move to grid below
    cy.focused().type('{downarrow}');
    
    // Should move to the grid in the row below
    cy.focused().should('have.attr', 'data-grid-item');
    
    // Press left arrow to move back
    cy.focused().type('{leftarrow}');
    
    // Should move to the grid to the left
    cy.focused().should('have.attr', 'data-grid-item');
    
    // Press up arrow to move back to the first row
    cy.focused().type('{uparrow}');
    
    // Should move to the grid in the row above
    cy.focused().should('have.attr', 'data-grid-item');
  });
  
  it('should activate grid when Enter key is pressed', () => {
    // Find the first grid and focus it
    cy.get('[data-grid-item]').first().focus();
    
    // Press Enter
    cy.focused().type('{enter}');
    
    // Modal should appear if the grid is empty (purchase modal)
    // or edit modal if it's leased
    cy.get('[data-modal]').should('be.visible');
  });
  
  it('should show hover state when grid is focused', () => {
    // Find the first grid and focus it
    cy.get('[data-grid-item]').first().focus();
    
    // Check for data-hovered attribute (set in our keyboard focus handler)
    cy.focused().should('have.attr', 'data-hovered', 'true');
    
    // Move focus away
    cy.focused().tab();
    
    // First grid should not have hovered state anymore
    cy.get('[data-grid-item]').first().should('not.have.attr', 'data-hovered', 'true');
  });
  
  it('should navigate to the first grid when Home key is pressed', () => {
    // Focus a grid in the middle
    cy.get('[data-grid-item]').eq(5).focus();
    
    // Press Home
    cy.focused().type('{home}');
    
    // First grid should be focused
    cy.get('[data-grid-item]').first().should('have.focus');
  });
  
  it('should navigate to the last grid when End key is pressed', () => {
    // Focus the first grid
    cy.get('[data-grid-item]').first().focus();
    
    // Press End
    cy.focused().type('{end}');
    
    // Last grid should be focused
    cy.get('[data-grid-item]').last().should('have.focus');
  });
  
  it('should skip focus to the next row start when PageDown is pressed', () => {
    // Assuming we have a grid with columns
    const columns = 5; // The number of columns in our grid
    
    // Focus the first grid
    cy.get('[data-grid-item]').first().focus();
    
    // Press PageDown
    cy.focused().type('{pagedown}');
    
    // Should focus the grid that is 'columns' away
    cy.get('[data-grid-item]').eq(columns).should('have.focus');
  });
  
  it('should skip focus to the previous row end when PageUp is pressed', () => {
    // Assuming we have a grid with columns
    const columns = 5; // The number of columns in our grid
    
    // Focus a grid in the second row
    cy.get('[data-grid-item]').eq(columns + 1).focus();
    
    // Press PageUp
    cy.focused().type('{pageup}');
    
    // Should focus the grid that is 'columns' back
    cy.get('[data-grid-item]').eq(1).should('have.focus');
  });
  
  it('should handle edge navigation correctly', () => {
    // Focus the first grid
    cy.get('[data-grid-item]').first().focus();
    
    // Try to navigate left (should stay on first grid)
    cy.focused().type('{leftarrow}');
    cy.get('[data-grid-item]').first().should('have.focus');
    
    // Try to navigate up (should stay on first grid)
    cy.focused().type('{uparrow}');
    cy.get('[data-grid-item]').first().should('have.focus');
    
    // Focus the last grid
    cy.get('[data-grid-item]').last().focus();
    
    // Try to navigate right (should stay on last grid)
    cy.focused().type('{rightarrow}');
    cy.get('[data-grid-item]').last().should('have.focus');
    
    // Find the number of grids and columns
    cy.get('[data-grid-item]').then($items => {
      const totalItems = $items.length;
      // Assuming a grid with 5 columns
      const columns = 5;
      const lastRowStartIndex = totalItems - (totalItems % columns || columns);
      
      // Focus a grid in the last row
      cy.get('[data-grid-item]').eq(lastRowStartIndex).focus();
      
      // Try to navigate down (should stay in the last row)
      cy.focused().type('{downarrow}');
      
      // Should still be in the last row
      cy.focused().invoke('index').should('be.gte', lastRowStartIndex);
    });
  });
}); 