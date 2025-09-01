import { POST } from '../transcribe/route'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { getAuthenticatedUserId } from '@/lib/api-utils'

// Mock dependencies
jest.mock('openai')
jest.mock('@/lib/api-utils')

describe('/api/transcribe', () => {
  const mockUserId = 'user-123'
  let mockOpenAI: any
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getAuthenticatedUserId as jest.Mock).mockResolvedValue(mockUserId)
    
    // Setup OpenAI mock
    mockOpenAI = {
      audio: {
        transcriptions: {
          create: jest.fn(),
        },
      },
    }
    ;(OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI)
    
    // Mock environment variable
    process.env.OPENAI_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  const createMockRequest = (formData: FormData) => {
    return new NextRequest('http://localhost:3000/api/transcribe', {
      method: 'POST',
      body: formData as any,
    })
  }

  const createMockAudioFile = (
    name: string = 'test.mp3',
    size: number = 1024,
    type: string = 'audio/mp3'
  ): File => {
    const buffer = new ArrayBuffer(size)
    return new File([buffer], name, { type })
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
      
      mockOpenAI.audio.transcriptions.create.mockResolvedValue(mockTranscription)
      
      const formData = new FormData()
      const audioFile = createMockAudioFile()
      formData.append('audio', audioFile)
      
      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.text).toBe('This is the transcribed text')
      expect(data.data.language).toBe('en')
      expect(data.data.duration).toBe(5.5)
      expect(data.data.confidence).toBeDefined()
      expect(data.data.metadata.model).toBe('whisper-1')
      
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.any(File),
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
      
      mockOpenAI.audio.transcriptions.create.mockResolvedValue(mockTranscription)
      
      const formData = new FormData()
      formData.append('audio', createMockAudioFile())
      
      const request = createMockRequest(formData)
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
      const formData = new FormData()
      
      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('MISSING_AUDIO_FILE')
      expect(data.error.message).toBe('No audio file provided')
    })

    it('should reject files exceeding size limit', async () => {
      const formData = new FormData()
      const largeFile = createMockAudioFile('large.mp3', 26 * 1024 * 1024) // 26MB
      formData.append('audio', largeFile)
      
      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FILE_TOO_LARGE')
      expect(data.error.message).toContain('File size exceeds maximum limit')
    })

    it('should accept valid audio formats', async () => {
      const validFormats = [
        { name: 'test.mp3', type: 'audio/mp3' },
        { name: 'test.wav', type: 'audio/wav' },
        { name: 'test.webm', type: 'audio/webm' },
        { name: 'test.m4a', type: 'audio/m4a' },
      ]

      for (const format of validFormats) {
        mockOpenAI.audio.transcriptions.create.mockResolvedValue({
          text: 'Test transcription',
        })

        const formData = new FormData()
        const audioFile = createMockAudioFile(format.name, 1024, format.type)
        formData.append('audio', audioFile)
        
        const request = createMockRequest(formData)
        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
      }
    })

    it('should reject invalid audio formats', async () => {
      const formData = new FormData()
      const invalidFile = createMockAudioFile('test.txt', 1024, 'text/plain')
      formData.append('audio', invalidFile)
      
      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_AUDIO_FORMAT')
      expect(data.error.message).toContain('Invalid audio format')
    })

    it('should accept files with valid extensions even if MIME type is generic', async () => {
      mockOpenAI.audio.transcriptions.create.mockResolvedValue({
        text: 'Test transcription',
      })

      const formData = new FormData()
      // Generic MIME type but valid extension
      const audioFile = createMockAudioFile('test.mp3', 1024, 'application/octet-stream')
      formData.append('audio', audioFile)
      
      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Authentication and Configuration', () => {
    it('should reject unauthenticated requests', async () => {
      ;(getAuthenticatedUserId as jest.Mock).mockRejectedValue(
        new Error('Unauthorized')
      )
      
      const formData = new FormData()
      formData.append('audio', createMockAudioFile())
      
      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should return error if OpenAI API key is not configured', async () => {
      delete process.env.OPENAI_API_KEY
      
      const formData = new FormData()
      formData.append('audio', createMockAudioFile())
      
      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CONFIGURATION_ERROR')
      expect(data.error.message).toBe('OpenAI API key not configured')
    })
  })

  describe('OpenAI API Error Handling', () => {
    it('should handle invalid API key error', async () => {
      const apiError = new OpenAI.APIError(
        401,
        { error: { message: 'Invalid API key' } },
        'Invalid API key',
        {}
      )
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(apiError)
      
      const formData = new FormData()
      formData.append('audio', createMockAudioFile())
      
      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('INVALID_API_KEY')
      expect(data.error.message).toBe('Invalid OpenAI API key')
    })

    it('should handle rate limit error', async () => {
      const apiError = new OpenAI.APIError(
        429,
        { error: { message: 'Rate limit exceeded' } },
        'Rate limit exceeded',
        {}
      )
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(apiError)
      
      const formData = new FormData()
      formData.append('audio', createMockAudioFile())
      
      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(data.error.message).toContain('rate limit exceeded')
    })

    it('should handle file too large error from OpenAI', async () => {
      const apiError = new OpenAI.APIError(
        413,
        { error: { message: 'File too large' } },
        'File too large',
        {}
      )
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(apiError)
      
      const formData = new FormData()
      formData.append('audio', createMockAudioFile())
      
      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(413)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FILE_TOO_LARGE')
      expect(data.error.message).toBe('Audio file is too large for processing')
    })

    it('should handle generic OpenAI API errors', async () => {
      const apiError = new OpenAI.APIError(
        500,
        { error: { message: 'Internal server error' } },
        'Internal server error',
        {}
      )
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(apiError)
      
      const formData = new FormData()
      formData.append('audio', createMockAudioFile())
      
      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should handle non-OpenAI errors', async () => {
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(
        new Error('Network error')
      )
      
      const formData = new FormData()
      formData.append('audio', createMockAudioFile())
      
      const request = createMockRequest(formData)
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
      
      mockOpenAI.audio.transcriptions.create.mockResolvedValue(mockTranscription)
      
      const formData = new FormData()
      formData.append('audio', createMockAudioFile())
      
      const request = createMockRequest(formData)
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
      
      mockOpenAI.audio.transcriptions.create.mockResolvedValue(mockTranscription)
      
      const formData = new FormData()
      formData.append('audio', createMockAudioFile())
      
      const request = createMockRequest(formData)
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
      
      mockOpenAI.audio.transcriptions.create.mockResolvedValue(mockTranscription)
      
      const formData = new FormData()
      formData.append('audio', createMockAudioFile())
      
      const request = createMockRequest(formData)
      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data.confidence).toBeUndefined()
    })
  })
})