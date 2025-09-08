import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock OpenAI before importing
vi.mock('openai', () => {
  const mockTranscriptionsCreate = vi.fn()
  
  class MockAPIError extends Error {
    public status: number
    public error: any
    public message: string 
    public headers: Headers

    constructor(status: number, error: any, message: string, headers: Headers) {
      super(message)
      this.status = status
      this.error = error
      this.message = message
      this.headers = headers
      this.name = 'APIError'
    }
  }

  return {
    default: class MockOpenAI {
      constructor() {
        return {
          audio: {
            transcriptions: {
              create: mockTranscriptionsCreate
            }
          }
        }
      }
      static APIError = MockAPIError
    },
    // Export the mock function so we can access it in tests
    mockTranscriptionsCreate
  }
})

// Mock api-utils
vi.mock('@/lib/api-utils')

// Import the mocked functions
import { getAuthenticatedUserId, successResponse, errorResponse, handleApiError } from '@/lib/api-utils'
import { mockTranscriptionsCreate } from 'openai'

// Import the module under test
import { POST } from './transcribe/route'

describe('/api/transcribe', () => {
  const mockUserId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(getAuthenticatedUserId).mockResolvedValue(mockUserId)
    vi.mocked(successResponse).mockImplementation((data, status = 200) => 
      NextResponse.json({ success: true, data }, { status })
    )
    vi.mocked(errorResponse).mockImplementation((message, code, status = 400) => 
      NextResponse.json({ success: false, error: { message, code } }, { status })
    )
    vi.mocked(handleApiError).mockImplementation((error) => {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } 
      }, { status: 500 })
    })
    
    process.env.OPENAI_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  const createMockRequest = (audioFile: File | null) => {
    return {
      formData: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue(audioFile)
      })
    } as unknown as NextRequest
  }

  const createMockAudioFile = (
    name: string = 'test.mp3',
    size: number = 1024,
    type: string = 'audio/mp3'
  ): File => {
    return {
      name,
      size,
      type,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(size)),
      lastModified: Date.now(),
      webkitRelativePath: ''
    } as unknown as File
  }

  describe('Successful transcription', () => {
    it('should successfully transcribe an audio file', async () => {
      const mockTranscription = {
        text: 'This is the transcribed text',
        language: 'en',
        duration: 5.5,
        segments: [
          { avg_logprob: -0.5, no_speech_prob: 0.1 },
          { avg_logprob: -0.3, no_speech_prob: 0.05 },
        ],
      }
      
      mockTranscriptionsCreate.mockResolvedValue(mockTranscription)
      
      const audioFile = createMockAudioFile()
      const request = createMockRequest(audioFile)
      
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.text).toBe('This is the transcribed text')
      expect(data.data.language).toBe('en')
      expect(data.data.duration).toBe(5.5)
      expect(data.data.confidence).toBeDefined()
      expect(data.data.metadata.model).toBe('whisper-1')
      
      expect(mockTranscriptionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.any(Object),
          model: 'whisper-1',
          response_format: 'verbose_json',
          language: 'en',
        })
      )
    })

    it('should handle transcription without segments data', async () => {
      const mockTranscription = {
        text: 'Transcribed text without segments',
        language: 'en',
      }
      
      mockTranscriptionsCreate.mockResolvedValue(mockTranscription)
      
      const audioFile = createMockAudioFile()
      const request = createMockRequest(audioFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.text).toBe('Transcribed text without segments')
      expect(data.data.confidence).toBeUndefined()
    })
  })

  describe('File validation', () => {
    it('should reject request without audio file', async () => {
      const request = createMockRequest(null)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('MISSING_AUDIO_FILE')
    })

    it('should reject files exceeding size limit', async () => {
      const largeFile = createMockAudioFile('large.mp3', 26 * 1024 * 1024) // 26MB
      const request = createMockRequest(largeFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FILE_TOO_LARGE')
    })

    it('should accept valid audio formats', async () => {
      const validFormats = [
        { name: 'test.mp3', type: 'audio/mp3' },
        { name: 'test.wav', type: 'audio/wav' },
        { name: 'test.webm', type: 'audio/webm' },
        { name: 'test.m4a', type: 'audio/m4a' },
      ]

      for (const format of validFormats) {
        mockTranscriptionsCreate.mockResolvedValue({
          text: 'Test transcription',
        })

        const audioFile = createMockAudioFile(format.name, 1024, format.type)
        const request = createMockRequest(audioFile)
        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      }
    })

    it('should reject invalid audio formats', async () => {
      const invalidFile = createMockAudioFile('test.txt', 1024, 'text/plain')
      const request = createMockRequest(invalidFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_AUDIO_FORMAT')
    })

    it('should accept files with valid extensions even if MIME type is generic', async () => {
      mockTranscriptionsCreate.mockResolvedValue({
        text: 'Test transcription',
      })

      // Generic MIME type but valid extension
      const audioFile = createMockAudioFile('test.mp3', 1024, 'application/octet-stream')
      const request = createMockRequest(audioFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Authentication and Configuration', () => {
    it('should reject unauthenticated requests', async () => {
      vi.mocked(getAuthenticatedUserId).mockRejectedValue(new Error('Unauthorized'))
      
      const audioFile = createMockAudioFile()
      const request = createMockRequest(audioFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should return error if OpenAI API key is not configured', async () => {
      delete process.env.OPENAI_API_KEY
      
      const audioFile = createMockAudioFile()
      const request = createMockRequest(audioFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CONFIGURATION_ERROR')
    })
  })

  describe('OpenAI API Error Handling', () => {
    it('should handle invalid API key error', async () => {
      // Import the MockAPIError from the mocked module
      const OpenAI = await import('openai')
      const apiError = new (OpenAI.default as any).APIError(
        401,
        { error: { message: 'Invalid API key' } },
        'Invalid API key',
        new Headers()
      )
      mockTranscriptionsCreate.mockRejectedValue(apiError)
      
      const audioFile = createMockAudioFile()
      const request = createMockRequest(audioFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_API_KEY')
    })

    it('should handle rate limit error', async () => {
      const OpenAI = await import('openai')
      const apiError = new (OpenAI.default as any).APIError(
        429,
        { error: { message: 'Rate limit exceeded' } },
        'Rate limit exceeded',
        new Headers()
      )
      mockTranscriptionsCreate.mockRejectedValue(apiError)
      
      const audioFile = createMockAudioFile()
      const request = createMockRequest(audioFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should handle file too large error from OpenAI', async () => {
      const OpenAI = await import('openai')
      const apiError = new (OpenAI.default as any).APIError(
        413,
        { error: { message: 'File too large' } },
        'File too large',
        new Headers()
      )
      mockTranscriptionsCreate.mockRejectedValue(apiError)
      
      const audioFile = createMockAudioFile()
      const request = createMockRequest(audioFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(413)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FILE_TOO_LARGE')
    })

    it('should handle generic OpenAI API errors', async () => {
      const OpenAI = await import('openai')
      const apiError = new (OpenAI.default as any).APIError(
        500,
        { error: { message: 'Internal server error' } },
        'Internal server error',
        new Headers()
      )
      mockTranscriptionsCreate.mockRejectedValue(apiError)
      
      const audioFile = createMockAudioFile()
      const request = createMockRequest(audioFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(503)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should handle non-OpenAI errors', async () => {
      mockTranscriptionsCreate.mockRejectedValue(
        new Error('Network error')
      )
      
      const audioFile = createMockAudioFile()
      const request = createMockRequest(audioFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })
  })

  describe('Confidence score calculation', () => {
    it('should calculate average confidence from segments', async () => {
      const mockTranscription = {
        text: 'Test text',
        segments: [
          { avg_logprob: -0.2 }, // exp(-0.2) ≈ 0.819
          { avg_logprob: -0.4 }, // exp(-0.4) ≈ 0.670
          { avg_logprob: -0.1 }, // exp(-0.1) ≈ 0.905
        ],
      }
      
      mockTranscriptionsCreate.mockResolvedValue(mockTranscription)
      
      const audioFile = createMockAudioFile()
      const request = createMockRequest(audioFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data.confidence).toBeDefined()
      expect(data.data.confidence).toBeGreaterThan(0)
      expect(data.data.confidence).toBeLessThan(1)
    })

    it('should handle segments without log probabilities', async () => {
      const mockTranscription = {
        text: 'Test text',
        segments: [
          { no_speech_prob: 0.1 },
          { no_speech_prob: 0.2 },
        ],
      }
      
      mockTranscriptionsCreate.mockResolvedValue(mockTranscription)
      
      const audioFile = createMockAudioFile()
      const request = createMockRequest(audioFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data.confidence).toBeUndefined()
    })

    it('should handle empty segments array', async () => {
      const mockTranscription = {
        text: 'Test text',
        segments: [],
      }
      
      mockTranscriptionsCreate.mockResolvedValue(mockTranscription)
      
      const audioFile = createMockAudioFile()
      const request = createMockRequest(audioFile)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data.confidence).toBeUndefined()
    })
  })
})