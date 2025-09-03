/**
 * @jest-environment node
 */
import { createServerClient } from '../server'
import { validateEnvironment, resetEnvironmentCache } from '../config'

// Mock Next.js cookies
const mockCookies = {
  getAll: jest.fn(() => [
    { name: 'sb-test-auth-token', value: 'mock-token' }
  ]),
  set: jest.fn(),
}

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookies))
}))

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
}

Object.defineProperty(process, 'env', {
  value: mockEnv,
})

describe('Modern Supabase Server Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetEnvironmentCache()
    mockCookies.getAll.mockClear()
    mockCookies.set.mockClear()
  })

  describe('createServerClient', () => {
    it('should create a server client with cookie handling', async () => {
      const client = await createServerClient()
      
      expect(client).toBeDefined()
      expect(client.supabaseUrl).toBe(mockEnv.NEXT_PUBLIC_SUPABASE_URL)
      expect(client.supabaseKey).toBe(mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    })

    it('should properly handle cookies for auth', async () => {
      const client = await createServerClient()
      
      // Should have cookie configuration
      expect(client).toBeDefined()
      
      // Should have auth functionality available
      expect(client.auth).toBeDefined()
      expect(typeof client.auth.getUser).toBe('function')
      
      // The cookie store should be configured (internal implementation detail)
      // We can't easily test the internal cookie handling without triggering actual auth operations
    })

    it('should be properly typed for server operations', async () => {
      const client = await createServerClient()
      
      // Should support RPC calls without type casting
      const rpcCall = client.rpc('search_notes', {
        query_embedding: [0.1, 0.2, 0.3],
        match_threshold: 0.5,
        match_count: 10,
        user_id_filter: 'test-user'
      })
      
      expect(rpcCall).toBeDefined()
    })

    it('should handle server-side auth properly', async () => {
      const client = await createServerClient()
      
      // Should be able to get user without browser context
      const userPromise = client.auth.getUser()
      expect(userPromise).toBeInstanceOf(Promise)
    })
  })

  describe('Environment Validation', () => {
    it('should validate required environment variables', () => {
      expect(() => validateEnvironment()).not.toThrow()
    })

    it('should throw error when required env vars are missing', () => {
      // Temporarily remove required env var
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      
      expect(() => validateEnvironment()).toThrow(
        'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL'
      )
      
      // Restore env var
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    })

    it('should provide helpful error messages for configuration issues', () => {
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      expect(() => validateEnvironment()).toThrow(
        /Missing required environment variable.*check your \.env\.local file/
      )
      
      // Restore env var
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })
  })

  describe('Server-specific Features', () => {
    it('should work in Node.js environment', async () => {
      const client = await createServerClient()
      
      expect(client).toBeDefined()
      expect(() => client.from('notes').select('*')).not.toThrow()
    })

    it('should handle cookie manipulation for auth tokens', async () => {
      const client = await createServerClient()
      
      // Mock some auth operation that would set cookies
      await client.auth.getUser()
      
      // Should be able to set cookies (mocked)
      expect(mockCookies.getAll).toHaveBeenCalled()
    })
  })
})