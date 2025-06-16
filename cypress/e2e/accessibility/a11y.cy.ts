/// <reference types="cypress" />
/// <reference types="cypress-axe" />

describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Load axe-core
    cy.injectAxe();
  });
  
  it('Main page should not have accessibility violations', () => {
    cy.visit('/');
    cy.wait(1000); // Wait for content to load
    cy.checkA11y();
  });
  
  it('Purchase modal should be accessible', () => {
    cy.visit('/');
    cy.wait(1000); // Wait for content to load
    
    // Open purchase modal
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Check only the modal for a11y issues
    cy.checkA11y('[data-testid="purchase-modal"]');
    
    // Modal should trap focus
    cy.focused().should('exist');
    
    // Tab through all focusable elements and verify we don't leave the modal
    let initialFocusedElement;
    cy.focused().then($el => {
      initialFocusedElement = $el[0];
    });
    
    // Tab through all elements and check if we get back to the initial element
    cy.tab().tab().tab().tab().tab().tab();
    
    cy.focused().then($el => {
      expect($el[0]).to.equal(initialFocusedElement);
    });
    
    // Modal should close when Escape is pressed
    cy.get('body').type('{esc}');
    cy.get('[data-testid="purchase-modal"]').should('not.exist');
  });
  
  it('Edit modal should be accessible', () => {
    cy.visit('/');
    cy.wait(1000); // Wait for content to load
    
    // Find and click a leased grid to open edit modal
    cy.get('[data-grid-item][data-status="leased"]').first().click();
    
    // Check only the modal for a11y issues
    cy.checkA11y('[data-testid="edit-modal"]');
    
    // Modal should have proper ARIA attributes
    cy.get('[role="dialog"]')
      .should('have.attr', 'aria-modal', 'true')
      .and('have.attr', 'aria-labelledby');
    
    // Heading should match the aria-labelledby value
    cy.get('[role="dialog"]').then($dialog => {
      const labelId = $dialog.attr('aria-labelledby');
      cy.get(`#${labelId}`).should('contain', 'Edit Grid Content');
    });
    
    // Form labels should be properly associated with inputs
    cy.get('label[for="content"]').should('exist');
    cy.get('#content').should('exist');
    
    cy.get('label[for="subscriptionId"]').should('exist');
    cy.get('#subscriptionId').should('exist');
    
    cy.get('label[for="email"]').should('exist');
    cy.get('#email').should('exist');
  });
  
  it('Grid container should have proper keyboard navigation', () => {
    cy.visit('/');
    cy.wait(1000); // Wait for content to load
    
    // Grid container should have proper ARIA role
    cy.get('[role="grid"]').should('exist');
    
    // Each grid item should be focusable and have appropriate attributes
    cy.get('[data-grid-item]').first()
      .should('have.attr', 'tabindex', '0')
      .and('have.attr', 'role', 'button');
    
    // Focus the first grid item
    cy.get('[data-grid-item]').first().focus();
    
    // Use arrow keys to navigate
    cy.focused().realPress('ArrowRight');
    
    // The focus should move to the next item
    cy.focused().should('not.equal', cy.get('[data-grid-item]').first());
  });
  
  it('Toast notifications should be accessible', () => {
    cy.visit('/');
    cy.wait(1000); // Wait for content to load
    
    // Trigger a toast notification
    // This might require different approach based on the implementation
    // For example, we can try to submit an invalid form:
    cy.get('[data-grid-item][data-status="empty"]').first().click();
    
    // Fill form with invalid data
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="terms-checkbox"]').click();
    
    // Try to submit, which should fail and show an error toast
    cy.get('[data-testid="purchase-button"]').click();
    
    // Wait for toast to appear
    cy.get('[role="status"], [aria-live]').should('exist');
    
    // Check toast for a11y issues
    cy.checkA11y('[role="status"], [aria-live]');
    
    // Toast should have appropriate ARIA attributes
    cy.get('[role="status"], [aria-live]').should(element => {
      expect(element).to.satisfy(($el) => {
        // Either role=status or aria-live should be present
        return $el.attr('role') === 'status' || $el.attr('aria-live') === 'polite' || $el.attr('aria-live') === 'assertive';
      });
    });
  });
  
  it('Color contrast should meet WCAG standards', () => {
    cy.visit('/');
    cy.wait(1000); // Wait for content to load
    
    // Custom axe configuration for color contrast only
    cy.checkA11y(null, {
      runOnly: {
        type: 'rule',
        values: ['color-contrast']
      }
    });
  });
  
  it('Interactive elements have accessible names', () => {
    cy.visit('/');
    cy.wait(1000); // Wait for content to load
    
    // All buttons should have accessible names
    cy.get('button').each($button => {
      cy.wrap($button).should($el => {
        expect($el.text().trim().length > 0 || $el.attr('aria-label')?.length > 0 || $el.find('*[aria-label]').length > 0).to.be.true;
      });
    });
    
    // All links should have accessible names
    cy.get('a').each($link => {
      cy.wrap($link).should($el => {
        expect($el.text().trim().length > 0 || $el.attr('aria-label')?.length > 0 || $el.find('*[aria-label]').length > 0).to.be.true;
      });
    });
  });
  
  it('Page should be navigable without a mouse', () => {
    cy.visit('/');
    cy.wait(1000); // Wait for content to load
    
    // Focus the first interactive element
    cy.focused().should('exist').then(() => {
      // If nothing is focused by default, tab to the first element
      cy.realPress('Tab');
    });
    
    // Tab through the whole page to make sure we can access all interactive elements
    let seenElements = 0;
    const maxElements = 50; // Safety limit
    
    function tabAndCheck() {
      cy.focused().then($el => {
        seenElements++;
        if (seenElements < maxElements) {
          cy.realPress('Tab').then(tabAndCheck);
        }
      });
    }
    
    tabAndCheck();
    
    // Verify we saw a reasonable number of elements
    cy.wrap(seenElements).should('be.gt', 5);
  });
  
  it('Skip to content link is available and working', () => {
    cy.visit('/');
    cy.wait(1000); // Wait for content to load
    
    // Press Tab to reveal the skip link
    cy.realPress('Tab');
    
    // Skip link should be visible
    cy.focused()
      .should('have.attr', 'href')
      .and('include', '#main');
    
    // Clicking the skip link should move focus to the main content
    cy.focused().click();
    
    // Focus should now be in the main content area
    cy.focused().should('exist');
    cy.focused().parents('#main').should('exist');
  });
}); 