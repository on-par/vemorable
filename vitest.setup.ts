import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables for testing
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test_clerk_publishable_key'
process.env.CLERK_SECRET_KEY = 'test_clerk_secret_key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_supabase_anon_key'
process.env.OPENAI_API_KEY = 'test_openai_api_key'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Mock Node.js globals that Next.js expects
if (typeof Request === 'undefined') {
  global.Request = class Request {
    url: string | URL
    init: RequestInit
    constructor(url: string | URL, init: RequestInit = {}) {
      this.url = url
      this.init = init
    }
  } as typeof Request
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    body: unknown
    init: ResponseInit
    constructor(body: unknown, init: ResponseInit = {}) {
      this.body = body
      this.init = init
    }
    json() {
      return Promise.resolve(this.body)
    }
  } as typeof Response
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    headers: Record<string, string>
    constructor(init: HeadersInit | Record<string, string> = {}) {
      this.headers = init instanceof Object ? (init as Record<string, string>) : {}
    }
    append(name: string, value: string) {
      this.headers[name] = value
    }
    get(name: string) {
      return this.headers[name]
    }
    set(name: string, value: string) {
      this.headers[name] = value
    }
    delete(name: string) {
      delete this.headers[name]
    }
    forEach(callback: (value: string, key: string) => void) {
      Object.entries(this.headers).forEach(([key, value]) => callback(value, key))
    }
  } as typeof Headers
}

// Mock window.matchMedia (only in browser environment)
if (typeof window !== 'undefined') {
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
}

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))