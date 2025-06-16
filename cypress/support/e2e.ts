import '@testing-library/cypress/add-commands';
import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

// Add image snapshot commands
addMatchImageSnapshotCommand({
  failureThreshold: 0.03,
  failureThresholdType: 'percent',
  customDiffConfig: { threshold: 0.1 },
  capture: 'viewport',
});

// Add tab command for keyboard navigation testing
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  const defaultOpts = { keyCode: 9, which: 9, shiftKey: false };

  if (subject) {
    cy.wrap(subject).trigger('keydown', defaultOpts);
  } else {
    cy.focused().trigger('keydown', defaultOpts);
  }

  return cy.document().trigger('keyup', defaultOpts);
});

// Add custom commands here
Cypress.Commands.add('loginByUI', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-cy=email-input]').type(email);
  cy.get('[data-cy=password-input]').type(password);
  cy.get('[data-cy=login-button]').click();
  cy.url().should('not.include', '/login');
});

// Mock API responses
Cypress.Commands.add('mockGridData', () => {
  cy.intercept('GET', '/api/grids', {
    fixture: 'grids.json',
  }).as('getGrids');
});

// Add TypeScript definitions
declare global {
  namespace Cypress {
    interface Chainable {
      loginByUI(email: string, password: string): void;
      mockGridData(): void;
      matchImageSnapshot(name?: string, options?: object): void;
      tab(options?: { shift: boolean }): Chainable<Element>;
    }
  }
} 