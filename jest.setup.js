// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

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
    constructor(url, init = {}) {
      this.url = url
      this.init = init
    }
  }
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.init = init
    }
    json() {
      return Promise.resolve(this.body)
    }
  }
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this.headers = init instanceof Object ? init : {}
    }
    append(name, value) {
      this.headers[name] = value
    }
    get(name) {
      return this.headers[name]
    }
    set(name, value) {
      this.headers[name] = value
    }
    delete(name) {
      delete this.headers[name]
    }
    forEach(callback) {
      Object.entries(this.headers).forEach(([key, value]) => callback(value, key))
    }
  }
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))