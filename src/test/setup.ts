import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test-key',
  VITE_API_URL: 'http://localhost:3001',
  VITE_WS_URL: 'http://localhost:3001',
}))

// Mock WebSocket
global.WebSocket = vi.fn() as any

// Mock fetch
global.fetch = vi.fn()

// Setup testing utilities
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
