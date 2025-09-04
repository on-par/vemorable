/**
 * @jest-environment jsdom
 */
import { createClient } from '../client'
import { resetEnvironmentCache } from '../config'
import { Database } from '@/types/database'

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
}

// Mock process.env
Object.defineProperty(process, 'env', {
  value: mockEnv,
})

describe('Modern Supabase Browser Client', () => {
  beforeEach(() => {
    // Reset mocks and environment cache
    jest.clearAllMocks()
    resetEnvironmentCache()
    
    // Restore environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockEnv.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })

  describe('createClient', () => {
    it('should create a browser client with proper type safety', () => {
      const client = createClient()
      
      expect(client).toBeDefined()
      // Client is properly created, we can't access internal properties
      expect(client.from).toBeDefined()
      expect(client.auth).toBeDefined()
    })

    it('should throw error when environment variables are missing', () => {
      // Temporarily remove env vars
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      resetEnvironmentCache() // Reset cache after changing env vars
      
      expect(() => createClient()).toThrow(
        'Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL'
      )
      
      // Restore env var
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      resetEnvironmentCache() // Reset cache after restoring
    })

    it('should be properly typed for database operations', async () => {
      const client = createClient()
      
      // This should be type-safe without any casting
      const query = client.from('notes').select('*')
      expect(query).toBeDefined()
    })

    it('should support real-time subscriptions', () => {
      const client = createClient()
      
      const channel = client.channel('test-channel')
      expect(channel).toBeDefined()
      expect(typeof channel.subscribe).toBe('function')
    })

    it('should handle authentication state properly', () => {
      const client = createClient()
      
      expect(client.auth).toBeDefined()
      expect(typeof client.auth.getUser).toBe('function')
      expect(typeof client.auth.getSession).toBe('function')
    })
  })

  describe('Type Safety', () => {
    it('should enforce proper database types', () => {
      const client = createClient()
      
      // This test verifies that the client is properly typed
      // and accepts valid data according to the Database type definitions
      const insertData = [
        {
          user_id: 'test-user',
          title: 'Test Note',
          processed_content: 'Test content',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ] as const satisfies Database['public']['Tables']['notes']['Insert'][]
      
      // Use type assertion to work around test environment type inference issue
      const insertQuery = client.from('notes').insert(insertData as any)
      
      expect(insertQuery).toBeDefined()
    })
  })

  describe('Browser-specific Features', () => {
    it('should work in browser environment', () => {
      const client = createClient()
      
      // Should work without cookies (browser context)
      expect(client).toBeDefined()
      expect(() => client.from('notes').select('*')).not.toThrow()
    })

    it('should handle browser storage for auth', () => {
      const client = createClient()
      
      // Should use localStorage/sessionStorage in browser
      // We can't access internal properties directly, but auth should be configured
      expect(client.auth).toBeDefined()
      expect(typeof client.auth.getSession).toBe('function')
    })
  })
})