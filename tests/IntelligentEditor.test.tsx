import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import IntelligentEditor from '../src/components/IntelligentEditor'

// Mock the services
vi.mock('../src/services/api', () => ({
  default: {
    searchEntities: vi.fn(() => Promise.resolve({ data: [] })),
    logAuditEvent: vi.fn(() => Promise.resolve({ data: {} }))
  }
}))

vi.mock('../src/services/websocket', () => ({
  default: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    emit: vi.fn()
  }
}))

describe('IntelligentEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the editor component', () => {
    render(<IntelligentEditor />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows suggestions dropdown when typing', async () => {
    render(<IntelligentEditor />)
    const editor = screen.getByRole('textbox')
    
    fireEvent.input(editor, { target: { textContent: 'cust' } })
    
    await waitFor(() => {
      expect(screen.getByTestId('suggestions-dropdown')).toBeInTheDocument()
    })
  })

  it('handles entity selection', async () => {
    render(<IntelligentEditor />)
    const editor = screen.getByRole('textbox')
    
    fireEvent.input(editor, { target: { textContent: '@john' } })
    
    await waitFor(() => {
      const suggestion = screen.getByText('John Doe')
      fireEvent.click(suggestion)
    })
    
    expect(editor).toHaveTextContent('John Doe')
  })

  it('displays real-time collaboration status', () => {
    render(<IntelligentEditor />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('handles date parsing correctly', async () => {
    render(<IntelligentEditor />)
    const editor = screen.getByRole('textbox')
    
    fireEvent.input(editor, { target: { textContent: 'tomorrow at 3pm' } })
    
    await waitFor(() => {
      expect(screen.getByTestId('date-suggestion')).toBeInTheDocument()
    })
  })
})
