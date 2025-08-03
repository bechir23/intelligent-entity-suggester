/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Example custom commands for the intelligent editor
Cypress.Commands.add('typeInEditor', (text: string) => {
  cy.get('[data-testid="editor"]').click().clear().type(text)
})

Cypress.Commands.add('waitForSuggestions', () => {
  cy.get('[data-testid="suggestions-dropdown"]', { timeout: 5000 }).should('be.visible')
})

Cypress.Commands.add('selectFirstSuggestion', () => {
  cy.get('[data-testid="suggestion-item"]').first().click()
})
