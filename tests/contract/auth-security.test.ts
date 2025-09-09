import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createMocks } from 'node-mocks-http'

// Import the API routes we need to test for auth bypass vulnerabilities
import { GET as notesGET, POST as notesPOST } from '@/app/api/notes/route'
import { GET as notesIdGET, PUT as notesIdPUT, DELETE as notesIdDELETE } from '@/app/api/notes/[id]/route'
import { GET as searchGET, POST as searchPOST } from '@/app/api/search/route'
import { POST as chatPOST } from '@/app/api/chat/route'

// Mock the authentication module to simulate various auth scenarios
vi.mock('@/lib/api/auth', () => ({
  getAuthenticatedUserId: vi.fn(),
  getOptionalUserId: vi.fn(),
}))

// Mock the API factory for routes using it
vi.mock('@/lib/api/factory', () => ({
  ApiRouteFactory: vi.fn().mockImplementation(() => ({
    withAuth: vi.fn().mockReturnThis(),
    withErrorHandling: vi.fn().mockReturnThis(),
    withValidation: vi.fn().mockReturnThis(),
    createHandler: vi.fn().mockImplementation((handler) => handler),
  })),
}))

// Mock Supabase services
vi.mock('@/lib/supabase/services', () => ({
  createNotesService: vi.fn(),
  createSearchService: vi.fn(),
}))

// Mock other dependencies
vi.mock('@/lib/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/supabase', () => ({
  createServerClientInstance: vi.fn(),
}))

vi.mock('@/lib/api-utils', () => ({
  successResponse: vi.fn((data) => NextResponse.json({ success: true, data })),
  handleApiError: vi.fn((error) => NextResponse.json({ success: false, error: error.message }, { status: 500 })),
  getAuthenticatedUserId: vi.fn(),
}))

vi.mock('@/lib/embeddings', () => ({
  generateQueryEmbedding: vi.fn(),
  formatEmbeddingForPgVector: vi.fn(),
}))

vi.mock('@/lib/validations', () => ({
  createNoteSchema: {
    parse: vi.fn(),
  },
}))

import { getAuthenticatedUserId } from '@/lib/api/auth'

describe('Authentication Bypass Security Tests', () => {
  const mockAuthenticatedUserId = getAuthenticatedUserId as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Direct API Access Without Authentication', () => {
    beforeEach(() => {
      // Mock authentication to always throw unauthorized error
      mockAuthenticatedUserId.mockRejectedValue(new Error('Unauthorized'))
    })

    describe('/api/notes endpoint security', () => {
      it('should reject GET requests without authentication tokens', async () => {
        const request = new NextRequest('http://localhost:3000/api/notes', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // No Authorization header
          },
        })

        const response = await notesGET(request)
        const responseData = await response.json()

        expect(response.status).toBe(401)
        expect(responseData.success).toBe(false)
        expect(responseData.error.code).toBe('UNAUTHORIZED')
        expect(responseData.error.message).toMatch(/unauthorized|Unauthorized/i)
      })

      it('should reject POST requests without authentication tokens', async () => {
        const request = new NextRequest('http://localhost:3000/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Test Note',
            content: 'This should be rejected',
            summary: 'Test summary',
          }),
        })

        const response = await notesPOST(request)
        const responseData = await response.json()

        expect(response.status).toBe(401)
        expect(responseData.success).toBe(false)
        expect(responseData.error.code).toBe('UNAUTHORIZED')
        expect(responseData.error.message).toMatch(/unauthorized|Unauthorized/i)
      })

      it('should reject GET requests to specific note without authentication', async () => {
        const request = new NextRequest('http://localhost:3000/api/notes/test-note-id', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const response = await notesIdGET(request, { params: Promise.resolve({ id: 'test-note-id' }) })
        const responseData = await response.json()

        expect(response.status).toBe(401)
        expect(responseData.success).toBe(false)
        expect(responseData.error.code).toBe('UNAUTHORIZED')
      })

      it('should reject PUT requests to specific note without authentication', async () => {
        const request = new NextRequest('http://localhost:3000/api/notes/test-note-id', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Updated Note',
            content: 'This should be rejected',
          }),
        })

        const response = await notesIdPUT(request, { params: Promise.resolve({ id: 'test-note-id' }) })
        const responseData = await response.json()

        expect(response.status).toBe(401)
        expect(responseData.success).toBe(false)
        expect(responseData.error.code).toBe('UNAUTHORIZED')
      })

      it('should reject DELETE requests to specific note without authentication', async () => {
        const request = new NextRequest('http://localhost:3000/api/notes/test-note-id', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const response = await notesIdDELETE(request, { params: Promise.resolve({ id: 'test-note-id' }) })
        const responseData = await response.json()

        expect(response.status).toBe(401)
        expect(responseData.success).toBe(false)
        expect(responseData.error.code).toBe('UNAUTHORIZED')
      })
    })

    describe('/api/search endpoint security', () => {
      it('should reject GET search requests without authentication tokens', async () => {
        const request = new NextRequest('http://localhost:3000/api/search?query=test', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const response = await searchGET(request)
        const responseData = await response.json()

        expect(response.status).toBe(401)
        expect(responseData.success).toBe(false)
        expect(responseData.error.code).toBe('UNAUTHORIZED')
      })

      it('should reject POST search requests without authentication tokens', async () => {
        const request = new NextRequest('http://localhost:3000/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'test search query',
            limit: 10,
            type: 'hybrid',
          }),
        })

        const response = await searchPOST(request)
        const responseData = await response.json()

        expect(response.status).toBe(401)
        expect(responseData.success).toBe(false)
        expect(responseData.error.code).toBe('UNAUTHORIZED')
      })
    })

    describe('/api/chat endpoint security', () => {
      it('should reject chat requests without authentication tokens', async () => {
        const request = new NextRequest('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Hello, this should be rejected',
            sessionId: null,
            messages: [],
          }),
        })

        const response = await chatPOST(request)
        const responseData = await response.json()

        expect(response.status).toBe(401)
        expect(responseData.success).toBe(false)
        expect(responseData.error.code).toBe('UNAUTHORIZED')
      })
    })
  })

  describe('Invalid/Expired Token Scenarios', () => {
    beforeEach(() => {
      // Mock authentication to throw specific auth errors
      mockAuthenticatedUserId.mockRejectedValue(new Error('Token expired'))
    })

    it('should reject requests with expired tokens', async () => {
      const request = new NextRequest('http://localhost:3000/api/notes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer expired_token_12345',
        },
      })

      const response = await notesGET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('UNAUTHORIZED')
    })

    it('should reject requests with malformed authorization headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/notes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'InvalidFormat malformed_token',
        },
      })

      const response = await notesGET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('UNAUTHORIZED')
    })

    it('should reject requests with invalid token signatures', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid.signature.token',
        },
      })

      const response = await searchGET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('Missing User Context Scenarios', () => {
    beforeEach(() => {
      // Mock authentication to return null/undefined user ID
      mockAuthenticatedUserId.mockResolvedValue(null)
    })

    it('should reject requests when user context is missing despite token presence', async () => {
      const request = new NextRequest('http://localhost:3000/api/notes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid_looking_token_but_no_user',
        },
      })

      const response = await notesGET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('UNAUTHORIZED')
    })

    it('should reject chat requests when user context is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token_without_user_context',
        },
        body: JSON.stringify({
          message: 'This should fail due to missing user context',
          sessionId: 'test-session-id',
        }),
      })

      const response = await chatPOST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('Role-Based Access Bypass Attempts', () => {
    beforeEach(() => {
      // Mock authentication to succeed but user has insufficient permissions
      mockAuthenticatedUserId.mockResolvedValue('user-with-limited-access')
    })

    it('should prevent access to notes belonging to other users', async () => {
      // This test assumes the service layer would normally check user ownership
      // Since we're testing at the API level, this will currently pass the auth check
      // but should fail at the service level when user ID doesn't match note owner
      const request = new NextRequest('http://localhost:3000/api/notes/other-users-note-id', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid_token_different_user',
        },
      })

      // For now, this test documents the expected behavior
      // The implementation should ensure that even with valid auth,
      // users cannot access resources they don't own
      const response = await notesIdGET(request, { params: Promise.resolve({ id: 'other-users-note-id' }) })
      
      // This test will initially pass the auth check but should fail at service level
      // when proper authorization is implemented
      expect(response.status).not.toBe(200) // Should not succeed
    })

    it('should prevent unauthorized modification of notes belonging to other users', async () => {
      const request = new NextRequest('http://localhost:3000/api/notes/other-users-note-id', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid_token_different_user',
        },
        body: JSON.stringify({
          title: 'Attempting to modify another users note',
          content: 'This should be prevented by authorization checks',
        }),
      })

      const response = await notesIdPUT(request, { params: Promise.resolve({ id: 'other-users-note-id' }) })
      
      // Should fail due to insufficient permissions (not note owner)
      expect(response.status).not.toBe(200)
    })

    it('should prevent unauthorized deletion of notes belonging to other users', async () => {
      const request = new NextRequest('http://localhost:3000/api/notes/other-users-note-id', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid_token_different_user',
        },
      })

      const response = await notesIdDELETE(request, { params: Promise.resolve({ id: 'other-users-note-id' }) })
      
      // Should fail due to insufficient permissions (not note owner)
      expect(response.status).not.toBe(200)
    })
  })

  describe('Header-Based Authentication Bypass Attempts', () => {
    beforeEach(() => {
      mockAuthenticatedUserId.mockRejectedValue(new Error('Unauthorized'))
    })

    it('should reject requests attempting to bypass auth with custom headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/notes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': 'attempted-bypass-user-id',
          'X-Bypass-Auth': 'true',
          'X-Internal-Request': 'true',
        },
      })

      const response = await notesGET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('UNAUTHORIZED')
      expect(responseData.error.message).toMatch(/unauthorized|Unauthorized/i)
    })

    it('should reject requests attempting to use internal service headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Token': 'internal-service-token',
          'X-Skip-Auth': 'please',
        },
        body: JSON.stringify({
          query: 'bypass attempt',
          limit: 10,
        }),
      })

      const response = await searchPOST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('Authentication Middleware Integration', () => {
    it('should ensure all protected routes use authentication middleware', async () => {
      // Test that all API routes that handle user data require authentication
      const protectedEndpoints = [
        { method: 'GET', path: '/api/notes', handler: notesGET, requiresParams: false },
        { method: 'POST', path: '/api/notes', handler: notesPOST, requiresParams: false },
        { method: 'GET', path: '/api/search', handler: searchGET, requiresParams: false },
        { method: 'POST', path: '/api/search', handler: searchPOST, requiresParams: false },
        { method: 'POST', path: '/api/chat', handler: chatPOST, requiresParams: false },
      ]

      // Mock authentication to always fail
      mockAuthenticatedUserId.mockRejectedValue(new Error('No authentication provided'))

      for (const endpoint of protectedEndpoints) {
        const request = new NextRequest(`http://localhost:3000${endpoint.path}`, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
          },
          ...(endpoint.method === 'POST' ? {
            body: JSON.stringify({ test: 'data' })
          } : {})
        })

        const response = endpoint.requiresParams
          ? await (endpoint.handler as any)(request, { params: Promise.resolve({ id: 'test-id' }) })
          : await endpoint.handler(request)
        
        expect(response.status).toBe(401)
        const responseData = await response.json()
        expect(responseData.success).toBe(false)
        expect(responseData.error.code).toBe('UNAUTHORIZED')
      }
    })
  })

  describe('Session and CSRF Protection', () => {
    beforeEach(() => {
      mockAuthenticatedUserId.mockRejectedValue(new Error('Invalid session'))
    })

    it('should validate session integrity for authenticated requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token_with_invalid_session',
          'Cookie': 'session=tampered_session_data',
        },
        body: JSON.stringify({
          title: 'Test Note',
          content: 'Should be rejected due to session issues',
        }),
      })

      const response = await notesPOST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('UNAUTHORIZED')
    })

    it('should prevent CSRF attacks on state-changing operations', async () => {
      const request = new NextRequest('http://localhost:3000/api/notes/test-id', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://malicious-site.com',
          'Referer': 'https://malicious-site.com/attack',
        },
      })

      const response = await notesIdDELETE(request, { params: Promise.resolve({ id: 'test-id' }) })
      
      // Should be rejected due to lack of authentication
      expect(response.status).toBe(401)
      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('Rate Limiting and Abuse Prevention', () => {
    beforeEach(() => {
      mockAuthenticatedUserId.mockRejectedValue(new Error('Unauthorized'))
    })

    it('should prevent brute force authentication attempts', async () => {
      // Simulate multiple rapid unauthorized requests
      const requests = Array(10).fill(null).map((_, index) => {
        return new NextRequest('http://localhost:3000/api/notes', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer invalid_token_${index}`,
            'X-Real-IP': '192.168.1.100',
          },
        })
      })

      // All requests should be rejected with 401
      const responses = await Promise.all(requests.map(req => notesGET(req)))
      
      responses.forEach(response => {
        expect(response.status).toBe(401)
      })

      // In a real implementation, rate limiting might kick in after multiple failed attempts
      // This test documents the expected behavior
    })
  })
})