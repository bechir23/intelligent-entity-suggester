describe('Intelligent Entity Suggester E2E Tests', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
  })

  it('loads the application successfully', () => {
    cy.contains('Intelligent Entity Suggester').should('be.visible')
    cy.get('[data-testid="editor"]').should('be.visible')
  })

  it('shows suggestions when typing', () => {
    cy.get('[data-testid="editor"]').click().type('cust')
    cy.get('[data-testid="suggestions-dropdown"]').should('be.visible')
    cy.get('[data-testid="suggestion-item"]').should('have.length.greaterThan', 0)
  })

  it('can select an entity suggestion', () => {
    cy.get('[data-testid="editor"]').click().type('@john')
    cy.get('[data-testid="suggestions-dropdown"]').should('be.visible')
    cy.get('[data-testid="suggestion-item"]').first().click()
    cy.get('[data-testid="editor"]').should('contain', 'John')
  })

  it('displays collaboration status', () => {
    cy.get('[data-testid="collaboration-status"]').should('contain', 'Connected')
  })

  it('handles date parsing', () => {
    cy.get('[data-testid="editor"]').click().type('tomorrow at 3pm')
    cy.get('[data-testid="date-suggestion"]').should('be.visible')
  })

  it('shows metadata panel', () => {
    cy.get('[data-testid="metadata-toggle"]').click()
    cy.get('[data-testid="metadata-panel"]').should('be.visible')
    cy.get('[data-testid="metadata-panel"]').should('contain', 'Entities Found')
  })

  it('performs search across different entity types', () => {
    // Test customer search
    cy.get('[data-testid="editor"]').click().type('customer:john')
    cy.get('[data-testid="suggestions-dropdown"]').should('be.visible')
    
    // Test product search
    cy.get('[data-testid="editor"]').clear().type('product:laptop')
    cy.get('[data-testid="suggestions-dropdown"]').should('be.visible')
    
    // Test task search
    cy.get('[data-testid="editor"]').clear().type('task:meeting')
    cy.get('[data-testid="suggestions-dropdown"]').should('be.visible')
  })

  it('handles real-time collaboration', () => {
    // Simulate another user typing
    cy.window().then((win) => {
      win.dispatchEvent(new CustomEvent('collaboration-update', {
        detail: { user: 'TestUser', action: 'typing' }
      }))
    })
    
    cy.get('[data-testid="collaboration-indicator"]').should('contain', 'TestUser is typing...')
  })

  it('validates performance requirements', () => {
    const startTime = Date.now()
    
    cy.get('[data-testid="editor"]').click().type('cust')
    cy.get('[data-testid="suggestions-dropdown"]').should('be.visible')
    
    cy.then(() => {
      const endTime = Date.now()
      const responseTime = endTime - startTime
      expect(responseTime).to.be.lessThan(150) // <150ms requirement
    })
  })

  it('handles error states gracefully', () => {
    // Simulate network error
    cy.intercept('GET', '/api/suggestions*', { forceNetworkError: true })
    
    cy.get('[data-testid="editor"]').click().type('test')
    cy.get('[data-testid="error-message"]').should('contain', 'Unable to load suggestions')
  })

  it('persists audit trail', () => {
    cy.get('[data-testid="editor"]').click().type('@john')
    cy.get('[data-testid="suggestion-item"]').first().click()
    
    // Check that audit event was logged
    cy.request('GET', '/api/audit').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.data).to.have.length.greaterThan(0)
    })
  })
})
