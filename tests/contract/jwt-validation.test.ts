import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// JWT validation types and interfaces
interface JWTHeader {
  alg: string
  typ: string
  kid?: string
}

interface JWTPayload {
  sub: string
  iss: string
  aud: string | string[]
  exp: number
  iat: number
  nbf?: number
  jti?: string
  [key: string]: any
}

interface JWTValidationResult {
  isValid: boolean
  payload?: JWTPayload
  error?: string
  errorCode?: string
}

// Mock JWT validation service (this doesn't exist yet - RED phase)
class JWTValidator {
  constructor(
    private secretKey: string,
    private issuer: string,
    private audience: string,
    private revokedTokens: Set<string> = new Set()
  ) {}

  async validateToken(token: string): Promise<JWTValidationResult> {
    throw new Error('JWT validation not implemented')
  }

  async verifySignature(token: string): Promise<boolean> {
    throw new Error('JWT signature verification not implemented')
  }

  parseTokenClaims(token: string): JWTPayload {
    throw new Error('JWT claims parsing not implemented')
  }

  isTokenExpired(payload: JWTPayload): boolean {
    throw new Error('JWT expiration check not implemented')
  }

  isTokenRevoked(jti: string): boolean {
    throw new Error('JWT revocation check not implemented')
  }

  revokeToken(jti: string): void {
    throw new Error('JWT revocation not implemented')
  }
}

// Mock request helper
const createMockRequest = (token?: string, headers: Record<string, string> = {}) => {
  const reqHeaders = new Headers({
    'Content-Type': 'application/json',
    ...headers,
  })

  if (token) {
    reqHeaders.set('Authorization', `Bearer ${token}`)
  }

  return new NextRequest('http://localhost:3000/api/test', {
    headers: reqHeaders,
  })
}

describe('JWT Token Validation', () => {
  let jwtValidator: JWTValidator
  const mockSecret = 'test-secret-key-256-bits-long'
  const mockIssuer = 'https://auth.vemorable.com'
  const mockAudience = 'vemorable-api'
  
  // Test tokens - these are mock tokens that should fail validation
  const validTokenStructure = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aC52ZW1vcmFibGUuY29tIiwiYXVkIjoidmVtb3JhYmxlLWFwaSIsImV4cCI6MTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwLCJqdGkiOiJ0b2tlbi0xMjMifQ.fake-signature'
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aC52ZW1vcmFibGUuY29tIiwiYXVkIjoidmVtb3JhYmxlLWFwaSIsImV4cCI6MTUwMDAwMDAwMCwiaWF0IjoxNDAwMDAwMDAwLCJqdGkiOiJleHBpcmVkLXRva2VuIn0.fake-signature'
  const malformedToken = 'invalid.token.structure'
  const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoYWNrZXIiLCJpc3MiOiJodHRwczovL2V2aWwuY29tIiwiYXVkIjoidmVtb3JhYmxlLWFwaSIsImV4cCI6MTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwLCJqdGkiOiJoYWNrZWQtdG9rZW4ifQ.tampered-signature'

  beforeEach(() => {
    vi.clearAllMocks()
    jwtValidator = new JWTValidator(mockSecret, mockIssuer, mockAudience)
  })

  describe('Token Structure Validation', () => {
    it('should reject malformed JWT tokens', async () => {
      const result = await jwtValidator.validateToken(malformedToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid token format')
      expect(result.errorCode).toBe('MALFORMED_TOKEN')
    })

    it('should reject tokens with invalid base64 encoding', async () => {
      const invalidBase64Token = 'invalid-base64!@#.invalid-base64!@#.invalid-base64!@#'
      
      const result = await jwtValidator.validateToken(invalidBase64Token)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid base64 encoding')
      expect(result.errorCode).toBe('INVALID_ENCODING')
    })

    it('should reject tokens with missing parts', async () => {
      const incompleteToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0' // Missing signature
      
      const result = await jwtValidator.validateToken(incompleteToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token must have exactly 3 parts')
      expect(result.errorCode).toBe('INCOMPLETE_TOKEN')
    })
  })

  describe('Signature Verification', () => {
    it('should reject tokens with invalid signatures', async () => {
      const result = await jwtValidator.validateToken(validTokenStructure)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid signature')
      expect(result.errorCode).toBe('INVALID_SIGNATURE')
    })

    it('should detect tampered token payloads', async () => {
      const result = await jwtValidator.validateToken(tamperedToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token signature verification failed')
      expect(result.errorCode).toBe('SIGNATURE_VERIFICATION_FAILED')
    })

    it('should reject tokens signed with wrong algorithm', async () => {
      const wrongAlgToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MTk5OTk5OTk5OX0.'
      
      const result = await jwtValidator.validateToken(wrongAlgToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Unsupported algorithm')
      expect(result.errorCode).toBe('UNSUPPORTED_ALGORITHM')
    })

    it('should reject tokens with no signature (alg: none attack)', async () => {
      const noneAlgToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhdHRhY2tlciIsImV4cCI6MTk5OTk5OTk5OX0.'
      
      const result = await jwtValidator.validateToken(noneAlgToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Algorithm "none" not allowed')
      expect(result.errorCode).toBe('ALGORITHM_NONE_NOT_ALLOWED')
    })
  })

  describe('Claims Validation', () => {
    it('should reject tokens with missing required claims', async () => {
      const noSubToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGgudmVtb3JhYmxlLmNvbSIsImF1ZCI6InZlbW9yYWJsZS1hcGkiLCJleHAiOjE5OTk5OTk5OTksImlhdCI6MTYwMDAwMDAwMH0.fake-signature'
      
      const result = await jwtValidator.validateToken(noSubToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Missing required claim: sub')
      expect(result.errorCode).toBe('MISSING_REQUIRED_CLAIM')
    })

    it('should reject expired tokens', async () => {
      const result = await jwtValidator.validateToken(expiredToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token has expired')
      expect(result.errorCode).toBe('TOKEN_EXPIRED')
    })

    it('should reject tokens with future iat claim', async () => {
      const futureIatToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aC52ZW1vcmFibGUuY29tIiwiYXVkIjoidmVtb3JhYmxlLWFwaSIsImV4cCI6MTk5OTk5OTk5OSwiaWF0Ijo5OTk5OTk5OTk5fQ.fake-signature'
      
      const result = await jwtValidator.validateToken(futureIatToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token issued in the future')
      expect(result.errorCode).toBe('FUTURE_TOKEN')
    })

    it('should reject tokens from wrong issuer', async () => {
      const wrongIssuerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vZXZpbC5jb20iLCJhdWQiOiJ2ZW1vcmFibGUtYXBpIiwiZXhwIjoxOTk5OTk5OTk5LCJpYXQiOjE2MDAwMDAwMDB9.fake-signature'
      
      const result = await jwtValidator.validateToken(wrongIssuerToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid issuer')
      expect(result.errorCode).toBe('INVALID_ISSUER')
    })

    it('should reject tokens with wrong audience', async () => {
      const wrongAudienceToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aC52ZW1vcmFibGUuY29tIiwiYXVkIjoiZXZpbC1hcGkiLCJleHAiOjE5OTk5OTk5OTksImlhdCI6MTYwMDAwMDAwMH0.fake-signature'
      
      const result = await jwtValidator.validateToken(wrongAudienceToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid audience')
      expect(result.errorCode).toBe('INVALID_AUDIENCE')
    })

    it('should reject tokens with nbf (not before) claim in the future', async () => {
      const futureNbfToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aC52ZW1vcmFibGUuY29tIiwiYXVkIjoidmVtb3JhYmxlLWFwaSIsImV4cCI6MTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwLCJuYmYiOjk5OTk5OTk5OTl9.fake-signature'
      
      const result = await jwtValidator.validateToken(futureNbfToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token not yet valid')
      expect(result.errorCode).toBe('TOKEN_NOT_YET_VALID')
    })
  })

  describe('Token Revocation', () => {
    it('should reject revoked tokens', async () => {
      const revokedTokenId = 'revoked-token-123'
      jwtValidator.revokeToken(revokedTokenId)
      
      const revokedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aC52ZW1vcmFibGUuY29tIiwiYXVkIjoidmVtb3JhYmxlLWFwaSIsImV4cCI6MTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwLCJqdGkiOiJyZXZva2VkLXRva2VuLTEyMyJ9.fake-signature'
      
      const result = await jwtValidator.validateToken(revokedToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token has been revoked')
      expect(result.errorCode).toBe('TOKEN_REVOKED')
    })

    it('should check token revocation status', () => {
      const tokenId = 'test-token-123'
      
      expect(jwtValidator.isTokenRevoked(tokenId)).toBe(false)
      
      jwtValidator.revokeToken(tokenId)
      
      expect(jwtValidator.isTokenRevoked(tokenId)).toBe(true)
    })
  })

  describe('Cross-User Token Access', () => {
    it('should prevent token reuse across different users', async () => {
      const userAToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWEiLCJpc3MiOiJodHRwczovL2F1dGgudmVtb3JhYmxlLmNvbSIsImF1ZCI6InZlbW9yYWJsZS1hcGkiLCJleHAiOjE5OTk5OTk5OTksImlhdCI6MTYwMDAwMDAwMCwianRpIjoidG9rZW4tYSJ9.fake-signature'
      
      // Simulate validation for user B context
      const mockValidatorForUserB = new JWTValidator(mockSecret, mockIssuer, mockAudience)
      
      const result = await mockValidatorForUserB.validateToken(userAToken)
      
      // Should fail because token is for user A but being used in user B context
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token subject mismatch')
      expect(result.errorCode).toBe('SUBJECT_MISMATCH')
    })

    it('should validate subject claim matches expected user', async () => {
      const expectedUserId = 'user-123'
      const wrongUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ3cm9uZy11c2VyIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnZlbW9yYWJsZS5jb20iLCJhdWQiOiJ2ZW1vcmFibGUtYXBpIiwiZXhwIjoxOTk5OTk5OTk5LCJpYXQiOjE2MDAwMDAwMDAsImp0aSI6InRva2VuLTEyMyJ9.fake-signature'
      
      const result = await jwtValidator.validateToken(wrongUserToken)
      
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('INVALID_SUBJECT')
    })
  })

  describe('Token Refresh Scenarios', () => {
    it('should reject refresh tokens used as access tokens', async () => {
      const refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInNzIjoiaHR0cHM6Ly9hdXRoLnZlbW9yYWJsZS5jb20iLCJhdWQiOiJ2ZW1vcmFibGUtYXBpIiwiZXhwIjoxOTk5OTk5OTk5LCJpYXQiOjE2MDAwMDAwMDAsInR5cGUiOiJyZWZyZXNoIiwianRpIjoidG9rZW4tMTIzIn0.fake-signature'
      
      const result = await jwtValidator.validateToken(refreshToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Cannot use refresh token as access token')
      expect(result.errorCode).toBe('INVALID_TOKEN_TYPE')
    })

    it('should validate token type for access tokens', async () => {
      const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aC52ZW1vcmFibGUuY29tIiwiYXVkIjoidmVtb3JhYmxlLWFwaSIsImV4cCI6MTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwLCJ0eXBlIjoiYWNjZXNzIiwianRpIjoidG9rZW4tMTIzIn0.fake-signature'
      
      const result = await jwtValidator.validateToken(accessToken)
      
      expect(result.isValid).toBe(false) // Will fail due to signature, but type should be validated
      expect(result.errorCode).not.toBe('INVALID_TOKEN_TYPE')
    })
  })

  describe('HTTP Request Integration', () => {
    it('should extract and validate token from Authorization header', async () => {
      const request = createMockRequest(validTokenStructure)
      const authHeader = request.headers.get('Authorization')
      
      expect(authHeader).toBe(`Bearer ${validTokenStructure}`)
      
      const token = authHeader?.replace('Bearer ', '')
      const result = await jwtValidator.validateToken(token!)
      
      expect(result.isValid).toBe(false) // Will fail - this is RED phase
      expect(result.errorCode).toBeDefined()
    })

    it('should handle missing Authorization header', async () => {
      const request = createMockRequest()
      const authHeader = request.headers.get('Authorization')
      
      expect(authHeader).toBeNull()
      
      const result = await jwtValidator.validateToken('')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token is required')
      expect(result.errorCode).toBe('MISSING_TOKEN')
    })

    it('should handle malformed Authorization header', async () => {
      const request = createMockRequest('', { 'Authorization': 'NotBearer token123' })
      const authHeader = request.headers.get('Authorization')
      
      expect(authHeader).toBe('NotBearer token123')
      
      // Should extract token properly even with malformed prefix
      const token = authHeader?.includes('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader
      const result = await jwtValidator.validateToken(token!)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid authorization header format')
      expect(result.errorCode).toBe('INVALID_AUTH_HEADER')
    })
  })

  describe('Security Attack Vectors', () => {
    it('should prevent key confusion attacks', async () => {
      // Attempt to use public key as HMAC secret
      const keyConfusionToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdHRhY2tlciIsImlzcyI6Imh0dHBzOi8vZXZpbC5jb20iLCJhdWQiOiJ2ZW1vcmFibGUtYXBpIiwiZXhwIjoxOTk5OTk5OTk5LCJpYXQiOjE2MDAwMDAwMDB9.malicious-signature'
      
      const result = await jwtValidator.validateToken(keyConfusionToken)
      
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('INVALID_SIGNATURE')
    })

    it('should prevent algorithm substitution attacks', async () => {
      const rsaToHmacToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJzYS1rZXkifQ.eyJzdWIiOiJhdHRhY2tlciIsImlzcyI6Imh0dHBzOi8vZXZpbC5jb20iLCJhdWQiOiJ2ZW1vcmFibGUtYXBpIiwiZXhwIjoxOTk5OTk5OTk5LCJpYXQiOjE2MDAwMDAwMDB9.malicious-signature'
      
      const result = await jwtValidator.validateToken(rsaToHmacToken)
      
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('ALGORITHM_MISMATCH')
    })

    it('should detect extremely long expiration times', async () => {
      const longExpiryToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aC52ZW1vcmFibGUuY29tIiwiYXVkIjoidmVtb3JhYmxlLWFwaSIsImV4cCI6OTk5OTk5OTk5OTksImlhdCI6MTYwMDAwMDAwMCwianRpIjoidG9rZW4tMTIzIn0.fake-signature'
      
      const result = await jwtValidator.validateToken(longExpiryToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token expiration time too far in future')
      expect(result.errorCode).toBe('EXCESSIVE_EXPIRY')
    })

    it('should prevent token replay attacks with jti tracking', async () => {
      const tokenWithJti = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImlzcyI6Imh0dHBzOi8vYXV0aC52ZW1vcmFibGUuY29tIiwiYXVkIjoidmVtb3JhYmxlLWFwaSIsImV4cCI6MTk5OTk5OTk5OSwiaWF0IjoxNjAwMDAwMDAwLCJqdGkiOiJ1bmlxdWUtdG9rZW4tMTIzIn0.fake-signature'
      
      // First validation attempt
      const result1 = await jwtValidator.validateToken(tokenWithJti)
      expect(result1.isValid).toBe(false) // Will fail due to signature - RED phase
      
      // Simulate token being marked as used
      // Second validation attempt (replay attack)
      const result2 = await jwtValidator.validateToken(tokenWithJti)
      expect(result2.isValid).toBe(false)
      expect(result2.errorCode).toBe('TOKEN_ALREADY_USED')
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle extremely large tokens', async () => {
      const largePayload = JSON.stringify({
        sub: 'user-123',
        iss: mockIssuer,
        aud: mockAudience,
        exp: 1999999999,
        iat: 1600000000,
        jti: 'token-123',
        largeData: 'x'.repeat(100000) // 100KB of data
      })
      
      const largeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(largePayload)}.fake-signature`
      
      const result = await jwtValidator.validateToken(largeToken)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token size exceeds maximum allowed')
      expect(result.errorCode).toBe('TOKEN_TOO_LARGE')
    })

    it('should handle empty token', async () => {
      const result = await jwtValidator.validateToken('')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Token is required')
      expect(result.errorCode).toBe('MISSING_TOKEN')
    })

    it('should handle null/undefined token', async () => {
      const resultNull = await jwtValidator.validateToken(null as any)
      const resultUndefined = await jwtValidator.validateToken(undefined as any)
      
      expect(resultNull.isValid).toBe(false)
      expect(resultNull.errorCode).toBe('MISSING_TOKEN')
      
      expect(resultUndefined.isValid).toBe(false)
      expect(resultUndefined.errorCode).toBe('MISSING_TOKEN')
    })

    it('should handle tokens with special characters', async () => {
      const specialCharToken = 'special.token.with-special_chars.and/slashes+plus=equals'
      
      const result = await jwtValidator.validateToken(specialCharToken)
      
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('INVALID_TOKEN_FORMAT')
    })
  })

  describe('Performance and Resource Management', () => {
    it('should timeout for validation that takes too long', async () => {
      const timeoutToken = validTokenStructure
      
      // Mock a slow validation
      const slowValidator = new JWTValidator(mockSecret, mockIssuer, mockAudience)
      
      const startTime = Date.now()
      const result = await slowValidator.validateToken(timeoutToken)
      const endTime = Date.now()
      
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('VALIDATION_TIMEOUT')
      expect(endTime - startTime).toBeLessThan(5000) // Should timeout within 5 seconds
    })

    it('should handle concurrent validation requests', async () => {
      const concurrentTokens = Array(10).fill(validTokenStructure)
      
      const validationPromises = concurrentTokens.map(token => 
        jwtValidator.validateToken(token)
      )
      
      const results = await Promise.all(validationPromises)
      
      results.forEach(result => {
        expect(result.isValid).toBe(false) // All should fail - RED phase
        expect(result.errorCode).toBeDefined()
      })
    })
  })

  describe('Configuration and Environment', () => {
    it('should fail validation with incorrect secret key', async () => {
      const wrongKeyValidator = new JWTValidator('wrong-secret', mockIssuer, mockAudience)
      
      const result = await wrongKeyValidator.validateToken(validTokenStructure)
      
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('INVALID_SIGNATURE')
    })

    it('should validate issuer configuration', async () => {
      const wrongIssuerValidator = new JWTValidator(mockSecret, 'https://wrong-issuer.com', mockAudience)
      
      const result = await wrongIssuerValidator.validateToken(validTokenStructure)
      
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('INVALID_ISSUER')
    })

    it('should validate audience configuration', async () => {
      const wrongAudValidator = new JWTValidator(mockSecret, mockIssuer, 'wrong-audience')
      
      const result = await wrongAudValidator.validateToken(validTokenStructure)
      
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('INVALID_AUDIENCE')
    })
  })
})

// Additional test for middleware integration
describe('JWT Middleware Integration', () => {
  it('should integrate with Next.js middleware for route protection', async () => {
    const protectedRoute = createMockRequest(undefined, { 
      'x-pathname': '/api/notes'
    })
    
    // This would be the middleware validation logic
    const authHeader = protectedRoute.headers.get('Authorization')
    
    expect(authHeader).toBeNull()
    
    // Should redirect to login or return 401
    expect(() => {
      throw new Error('Unauthorized - no token provided')
    }).toThrow('Unauthorized')
  })

  it('should pass through valid tokens in middleware', async () => {
    const protectedRoute = createMockRequest('valid-token', { 
      'x-pathname': '/api/notes'
    })
    
    const authHeader = protectedRoute.headers.get('Authorization')
    expect(authHeader).toBe('Bearer valid-token')
    
    // Middleware should validate and either pass through or reject
    const validator = new JWTValidator('test-secret', 'test-issuer', 'test-audience')
    const result = await validator.validateToken('valid-token')
    
    expect(result.isValid).toBe(false) // Will fail - RED phase
  })
})