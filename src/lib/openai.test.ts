import { cleanupTranscript, generateTitleAndSummary, generateTags, processNoteWithAI, openai } from './openai'
import { generateEmbedding } from './embeddings'
import OpenAI from 'openai'

// Mock the OpenAI module
jest.mock('openai')

describe('OpenAI Utility Functions', () => {
  let mockCreate: jest.Mock
  let mockEmbeddingsCreate: jest.Mock
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Setup the mock for OpenAI
    mockCreate = jest.fn()
    mockEmbeddingsCreate = jest.fn()
    const mockOpenAI = {
      chat: {
        completions: {
          create: mockCreate
        }
      },
      embeddings: {
        create: mockEmbeddingsCreate
      }
    }
    ;(OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => mockOpenAI as any)
  })

  describe('cleanupTranscript', () => {
    it('should successfully clean a transcript', async () => {
      const rawTranscript = 'Um, so like, I think we should, uh, you know, implement this feature.'
      const cleanedText = 'I think we should implement this feature.'
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: cleanedText
          }
        }]
      })

      const result = await cleanupTranscript(rawTranscript)
      
      expect(result.cleanedText).toBe(cleanedText)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          max_tokens: 2000
        })
      )
    })

    it('should throw error for empty transcript', async () => {
      await expect(cleanupTranscript('')).rejects.toThrow('Transcript is empty')
      await expect(cleanupTranscript('  ')).rejects.toThrow('Transcript is empty')
    })

    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'))
      
      await expect(cleanupTranscript('Some text')).rejects.toThrow('Failed to clean transcript')
    })

    it('should fallback to original transcript if response is empty', async () => {
      const rawTranscript = 'Original text'
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: null
          }
        }]
      })

      const result = await cleanupTranscript(rawTranscript)
      expect(result.cleanedText).toBe(rawTranscript)
    })
  })

  describe('generateTitleAndSummary', () => {
    it('should successfully generate title and summary', async () => {
      const content = 'This is a note about implementing a new feature for user authentication.'
      const mockResponse = {
        title: 'User Authentication Feature',
        summary: 'Implementation notes for new auth system.'
      }
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockResponse)
          }
        }]
      })

      const result = await generateTitleAndSummary(content)
      
      expect(result.title).toBe(mockResponse.title)
      expect(result.summary).toBe(mockResponse.summary)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          max_tokens: 200,
          response_format: { type: "json_object" }
        })
      )
    })

    it('should throw error for empty content', async () => {
      await expect(generateTitleAndSummary('')).rejects.toThrow('Content is empty')
      await expect(generateTitleAndSummary('  ')).rejects.toThrow('Content is empty')
    })

    it('should truncate title and summary to max lengths', async () => {
      const longTitle = 'A'.repeat(100)
      const longSummary = 'B'.repeat(300)
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              title: longTitle,
              summary: longSummary
            })
          }
        }]
      })

      const result = await generateTitleAndSummary('Some content')
      
      expect(result.title.length).toBe(60)
      expect(result.summary.length).toBe(200)
    })

    it('should handle invalid JSON response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON'
          }
        }]
      })

      await expect(generateTitleAndSummary('Some content')).rejects.toThrow('Failed to generate title and summary')
    })

    it('should handle missing fields in response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({ title: 'Only title' })
          }
        }]
      })

      await expect(generateTitleAndSummary('Some content')).rejects.toThrow('Failed to generate title and summary')
    })
  })

  describe('generateTags', () => {
    it('should successfully generate tags', async () => {
      const content = 'This is about machine learning and artificial intelligence in healthcare.'
      const mockTags = ['machine learning', 'ai', 'healthcare', 'technology']
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({ tags: mockTags })
          }
        }]
      })

      const result = await generateTags(content)
      
      expect(result.tags).toEqual(mockTags)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          temperature: 0.6,
          max_tokens: 150,
          response_format: { type: "json_object" }
        })
      )
    })

    it('should throw error for empty content', async () => {
      await expect(generateTags('')).rejects.toThrow('Content is empty')
      await expect(generateTags('  ')).rejects.toThrow('Content is empty')
    })

    it('should clean and validate tags', async () => {
      const mockTags = [
        'UPPERCASE',
        '  spaces  ',
        'very-long-tag-that-exceeds-twenty-characters',
        '',
        null,
        123,
        'valid-tag'
      ]
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({ tags: mockTags })
          }
        }]
      })

      const result = await generateTags('Some content')
      
      // Should lowercase, trim, truncate to 20 chars, and filter invalid tags
      expect(result.tags).toEqual([
        'uppercase',
        'spaces',
        'very-long-tag-that-e',
        'valid-tag'
      ])
    })

    it('should limit to maximum 7 tags', async () => {
      const mockTags = Array(10).fill('tag').map((t, i) => `${t}${i}`)
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({ tags: mockTags })
          }
        }]
      })

      const result = await generateTags('Some content')
      
      expect(result.tags.length).toBe(7)
    })

    it('should handle invalid response structure', async () => {
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({ notTags: ['tag1'] })
          }
        }]
      })

      await expect(generateTags('Some content')).rejects.toThrow('Failed to generate tags')
    })
  })

  describe('processNoteWithAI', () => {
    it('should process note through all AI functions successfully', async () => {
      const transcript = 'Um, this is, like, a test transcript about AI.'
      
      // Mock responses for each function call
      const cleanedText = 'This is a test transcript about AI.'
      const titleSummaryResponse = {
        title: 'AI Test Transcript',
        summary: 'A test transcript discussing AI topics.'
      }
      const tagsResponse = {
        tags: ['ai', 'test', 'transcript']
      }

      mockCreate
        .mockResolvedValueOnce({
          choices: [{
            message: { content: cleanedText }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: { content: JSON.stringify(titleSummaryResponse) }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: { content: JSON.stringify(tagsResponse) }
          }]
        })

      const result = await processNoteWithAI(transcript)
      
      expect(result).toEqual({
        cleanedTranscript: cleanedText,
        title: titleSummaryResponse.title,
        summary: titleSummaryResponse.summary,
        tags: tagsResponse.tags
      })
      
      expect(mockCreate).toHaveBeenCalledTimes(3)
    })

    it('should propagate errors from any step', async () => {
      const transcript = 'Test transcript'
      
      // Make the first call fail
      mockCreate.mockRejectedValueOnce(new Error('API Error'))

      await expect(processNoteWithAI(transcript)).rejects.toThrow('Failed to clean transcript')
    })

    it('should handle error in title/summary generation', async () => {
      const transcript = 'Test transcript'
      
      mockCreate
        .mockResolvedValueOnce({
          choices: [{
            message: { content: 'Cleaned text' }
          }]
        })
        .mockRejectedValueOnce(new Error('API Error'))

      await expect(processNoteWithAI(transcript)).rejects.toThrow('Failed to generate title and summary')
    })

    it('should handle error in tag generation', async () => {
      const transcript = 'Test transcript'
      
      mockCreate
        .mockResolvedValueOnce({
          choices: [{
            message: { content: 'Cleaned text' }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: { content: JSON.stringify({ title: 'Title', summary: 'Summary' }) }
          }]
        })
        .mockRejectedValueOnce(new Error('API Error'))

      await expect(processNoteWithAI(transcript)).rejects.toThrow('Failed to generate tags')
    })
  })

  describe('generateEmbedding', () => {

    it('should validate input', async () => {
      await expect(generateEmbedding('')).rejects.toThrow('Text is empty or invalid')
      await expect(generateEmbedding('  ')).rejects.toThrow('Text is empty or invalid')
    })

    it('should handle API errors correctly', async () => {
      mockEmbeddingsCreate.mockRejectedValue(new Error('API Error'))
      
      await expect(generateEmbedding('Some text')).rejects.toThrow('Failed to generate embedding')
    })

    it('should successfully generate embedding', async () => {
      const mockResponse = {
        data: [{
          embedding: [0.1, 0.2, 0.3]
        }],
        model: 'text-embedding-ada-002',
        usage: {
          prompt_tokens: 4,
          total_tokens: 4
        }
      }
      
      mockEmbeddingsCreate.mockResolvedValue(mockResponse)

      const result = await generateEmbedding('test text')
      
      expect(result.embedding).toEqual([0.1, 0.2, 0.3])
      expect(result.model).toBe('text-embedding-ada-002')
      expect(result.usage.prompt_tokens).toBe(4)
      expect(result.usage.total_tokens).toBe(4)
    })
  })
})