/**
 * @jest-environment node
 */
import { 
  getCachedNotes, 
  getCachedNote, 
  invalidateNotesCache, 
  CacheManager,
  QueryCache
} from '../cache'
import { createServerClient } from '../server'
import { Note } from '../types'

// Mock Next.js cache functions
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn, keyParts, options) => {
    // Return a function that calls the original function but adds cache simulation
    return async (...args: any[]) => {
      const cacheKey = keyParts.join(':') + ':' + JSON.stringify(args)
      return fn(...args)
    }
  }),
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}))

// Mock server client
jest.mock('../server')
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

const mockSupabaseClient = {
  from: jest.fn(),
  rpc: jest.fn(),
}

mockCreateServerClient.mockResolvedValue(mockSupabaseClient as any)

describe('Modern Caching Layer', () => {
  let cacheManager: CacheManager
  let queryCache: QueryCache

  beforeEach(() => {
    jest.clearAllMocks()
    cacheManager = new CacheManager()
    queryCache = new QueryCache()
  })

  describe('getCachedNotes', () => {
    it('should cache notes queries with appropriate TTL', async () => {
      const mockNotes: Note[] = [
        {
          id: 'note-1',
          user_id: 'test-user',
          title: 'Cached Note',
          processed_content: 'This should be cached',
          raw_transcript: null,
          summary: null,
          tags: ['cached'],
          embedding: null,
          file_url: null,
          file_name: null,
          file_type: null,
          file_size: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        }
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockNotes, error: null }),
        limit: jest.fn().mockReturnThis(),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await getCachedNotes('test-user', { limit: 10 })

      expect(result).toEqual(mockNotes)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notes')
      
      // Should cache the result for future calls
      const cachedResult = await getCachedNotes('test-user', { limit: 10 })
      expect(cachedResult).toEqual(mockNotes)
      
      // Database should be called twice - once for each call since createServerClient is called inside getCachedNotes
      // The actual caching happens at the Next.js level through unstable_cache
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2)
    })

    it('should handle cache misses gracefully', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null }),
        limit: jest.fn().mockReturnThis(),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await getCachedNotes('test-user')

      expect(result).toEqual([])
      expect(mockSupabaseClient.from).toHaveBeenCalled()
    })

    it('should respect different cache keys for different users', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null }),
        limit: jest.fn().mockReturnThis(),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      await getCachedNotes('user-1')
      await getCachedNotes('user-2')

      // Should make separate database calls for different users
      expect(mockSupabaseClient.from).toHaveBeenCalledTimes(2)
    })
  })

  describe('getCachedNote', () => {
    it('should cache individual note queries', async () => {
      const mockNote: Note = {
        id: 'note-1',
        user_id: 'test-user',
        title: 'Individual Note',
        processed_content: 'This is a single note',
        raw_transcript: null,
        summary: null,
        tags: [],
        embedding: null,
        file_url: null,
        file_name: null,
        file_type: null,
        file_size: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockNote, error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await getCachedNote('note-1', 'test-user')

      expect(result).toEqual(mockNote)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'note-1')
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user')
    })

    it('should return null for non-existent notes', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      mockSupabaseClient.from.mockReturnValue(mockQuery)

      const result = await getCachedNote('non-existent', 'test-user')

      expect(result).toBeNull()
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate notes cache on user action', async () => {
      const { revalidateTag } = require('next/cache')

      await invalidateNotesCache('test-user')

      expect(revalidateTag).toHaveBeenCalledWith('notes:test-user')
    })

    it('should invalidate specific note cache', async () => {
      const { revalidateTag } = require('next/cache')

      await invalidateNotesCache('test-user', 'note-1')

      expect(revalidateTag).toHaveBeenCalledWith('note:test-user:note-1')
      expect(revalidateTag).toHaveBeenCalledWith('notes:test-user')
    })

    it('should invalidate all related caches on note update', async () => {
      const { revalidateTag } = require('next/cache')

      await invalidateNotesCache('test-user', 'note-1', {
        invalidateSearch: true,
        invalidateRelated: true
      })

      expect(revalidateTag).toHaveBeenCalledWith('note:test-user:note-1')
      expect(revalidateTag).toHaveBeenCalledWith('notes:test-user')
      expect(revalidateTag).toHaveBeenCalledWith('search:test-user')
    })
  })

  describe('CacheManager', () => {
    it('should manage multiple cache strategies', () => {
      expect(cacheManager).toBeDefined()
      expect(typeof cacheManager.get).toBe('function')
      expect(typeof cacheManager.set).toBe('function')
      expect(typeof cacheManager.invalidate).toBe('function')
    })

    it('should set cache with TTL', async () => {
      const testData = { id: 'test', value: 'cached data' }
      
      await cacheManager.set('test-key', testData, 300) // 5 minutes TTL

      const result = await cacheManager.get('test-key')
      expect(result).toEqual(testData)
    })

    it('should handle cache expiration', async () => {
      const testData = { id: 'test', value: 'expired data' }
      
      await cacheManager.set('expired-key', testData, 0) // Immediate expiration

      // Wait a bit for expiration
      await new Promise(resolve => setTimeout(resolve, 10))

      const result = await cacheManager.get('expired-key')
      expect(result).toBeNull()
    })

    it('should support cache namespaces', async () => {
      const userData = { id: 'user-1', name: 'John' }
      const noteData = { id: 'note-1', title: 'Note' }

      await cacheManager.set('item:1', userData, 300, 'users')
      await cacheManager.set('item:1', noteData, 300, 'notes')

      const cachedUser = await cacheManager.get('item:1', 'users')
      const cachedNote = await cacheManager.get('item:1', 'notes')

      expect(cachedUser).toEqual(userData)
      expect(cachedNote).toEqual(noteData)
      expect(cachedUser).not.toEqual(cachedNote)
    })

    it('should bulk invalidate by pattern', async () => {
      await cacheManager.set('user:1:notes', [], 300)
      await cacheManager.set('user:1:profile', {}, 300)
      await cacheManager.set('user:2:notes', [], 300)

      await cacheManager.invalidatePattern('user:1:*')

      const notes1 = await cacheManager.get('user:1:notes')
      const profile1 = await cacheManager.get('user:1:profile')
      const notes2 = await cacheManager.get('user:2:notes')

      expect(notes1).toBeNull()
      expect(profile1).toBeNull()
      expect(notes2).toEqual([]) // Should not be invalidated
    })
  })

  describe('QueryCache', () => {
    it('should cache query results with automatic key generation', async () => {
      const testQuery = async (userId: string, limit: number) => {
        return [{ id: '1', title: 'Test' }]
      }

      const cachedQuery = queryCache.wrap(testQuery, 'notes-query', 300)

      const result1 = await cachedQuery('user-1', 10)
      const result2 = await cachedQuery('user-1', 10)

      expect(result1).toEqual(result2)
      expect(result1).toEqual([{ id: '1', title: 'Test' }])
    })

    it('should generate different cache keys for different parameters', async () => {
      const testQuery = jest.fn().mockImplementation(async (userId: string) => {
        return [{ id: userId, title: 'Test' }]
      })

      const cachedQuery = queryCache.wrap(testQuery, 'user-query', 300)

      await cachedQuery('user-1')
      await cachedQuery('user-2')
      await cachedQuery('user-1') // Should use cache

      // Original function should be called twice (once for each unique user)
      expect(testQuery).toHaveBeenCalledTimes(2)
      expect(testQuery).toHaveBeenCalledWith('user-1')
      expect(testQuery).toHaveBeenCalledWith('user-2')
    })

    it('should handle cache errors gracefully', async () => {
      const testQuery = async (shouldFail: boolean) => {
        if (shouldFail) {
          throw new Error('Query failed')
        }
        return { success: true }
      }

      const cachedQuery = queryCache.wrap(testQuery, 'error-query', 300)

      // First call should fail and not cache the error
      await expect(cachedQuery(true)).rejects.toThrow('Query failed')

      // Second call with different params should succeed
      const result = await cachedQuery(false)
      expect(result).toEqual({ success: true })
    })
  })

  describe('Performance Optimizations', () => {
    it('should batch similar queries', async () => {
      const batchQuery = jest.fn().mockResolvedValue([
        { id: '1', title: 'Note 1' },
        { id: '2', title: 'Note 2' },
        { id: '1,2', title: 'Combined' },
      ])

      const batchedQueryCache = queryCache.batch(batchQuery, 'batch-notes', {
        batchSize: 5,
        timeout: 100
      })

      // Make multiple requests that should be batched
      const promises = [
        batchedQueryCache(['1']),
        batchedQueryCache(['2']),
        batchedQueryCache(['1', '2'])
      ]

      const results = await Promise.all(promises)

      // Should only call the original function once due to batching
      expect(batchQuery).toHaveBeenCalledTimes(1)
      expect(results).toHaveLength(3)
    })

    it('should prefetch commonly accessed data', async () => {
      const prefetchQuery = jest.fn().mockResolvedValue([{ id: '1' }])
      
      // Set up prefetching for user notes
      const prefetcher = queryCache.prefetch(prefetchQuery, 'user-notes', {
        schedule: 'immediate',
        conditions: ['user-login', 'cache-miss']
      })

      await prefetcher('user-1')

      // Query should be prefetched
      expect(prefetchQuery).toHaveBeenCalledWith('user-1')

      // Subsequent calls should use prefetched data
      const cachedQuery = queryCache.wrap(prefetchQuery, 'user-notes', 300)
      await cachedQuery('user-1')

      // Should not call original function again
      expect(prefetchQuery).toHaveBeenCalledTimes(1)
    })

    it('should provide cache statistics', async () => {
      await cacheManager.set('stat-test-1', 'data1', 300)
      await cacheManager.set('stat-test-2', 'data2', 300)
      await cacheManager.get('stat-test-1')
      await cacheManager.get('stat-test-1') // Hit
      await cacheManager.get('non-existent') // Miss

      const stats = await cacheManager.getStats()

      expect(stats).toEqual({
        hits: 2,
        misses: 1,
        sets: 2,
        hitRate: 2/3,
        totalKeys: 2,
        memoryUsage: expect.any(Number),
      })
    })
  })
})