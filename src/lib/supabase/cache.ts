import { unstable_cache, revalidateTag, revalidatePath } from 'next/cache'
import { Note, SearchParams, PaginationParams } from './types'
import { createServerClient } from './server'

/**
 * Cache configuration constants
 */
const CACHE_CONFIG = {
  // Cache TTL in seconds
  TTL: {
    NOTES_LIST: 300,      // 5 minutes
    SINGLE_NOTE: 600,     // 10 minutes
    SEARCH_RESULTS: 180,  // 3 minutes
    USER_TAGS: 900,       // 15 minutes
    CHAT_SESSIONS: 300,   // 5 minutes
  },
  
  // Cache tags for invalidation
  TAGS: {
    NOTES: (userId: string) => `notes:${userId}`,
    NOTE: (userId: string, noteId: string) => `note:${userId}:${noteId}`,
    SEARCH: (userId: string) => `search:${userId}`,
    TAGS: (userId: string) => `tags:${userId}`,
    CHAT: (userId: string) => `chat:${userId}`,
    CHAT_SESSION: (sessionId: string) => `chat-session:${sessionId}`,
  }
}

/**
 * Get cached notes with pagination and filtering
 */
export const getCachedNotes = unstable_cache(
  async (userId: string, params: SearchParams = {}) => {
    const supabase = await createServerClient()
    const {
      limit = 50,
      offset = 0,
      search,
      tags,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = params

    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,processed_content.ilike.%${search}%`)
    }

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags)
    }

    // Apply sorting
    if (['created_at', 'updated_at', 'title'].includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching cached notes:', error)
      return []
    }

    return data || []
  },
  ['notes'],
  {
    revalidate: CACHE_CONFIG.TTL.NOTES_LIST,
    tags: ['notes']
  }
)

/**
 * Get cached individual note
 */
export const getCachedNote = unstable_cache(
  async (noteId: string, userId: string): Promise<Note | null> => {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null
      }
      console.error('Error fetching cached note:', error)
      return null
    }

    return data
  },
  ['note'],
  {
    revalidate: CACHE_CONFIG.TTL.SINGLE_NOTE,
    tags: ['note']
  }
)

/**
 * Get cached user tags
 */
export const getCachedUserTags = unstable_cache(
  async (userId: string): Promise<string[]> => {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('notes')
      .select('tags')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .not('tags', 'is', null)

    if (error) {
      console.error('Error fetching cached user tags:', error)
      return []
    }

    if (!data) return []

    // Flatten and deduplicate tags
    const allTags = data.flatMap((note: any) => note.tags || [])
    return [...new Set(allTags)].sort()
  },
  ['user-tags'],
  {
    revalidate: CACHE_CONFIG.TTL.USER_TAGS,
    tags: ['user-tags']
  }
)

/**
 * Cache invalidation functions
 */

/**
 * Invalidate notes cache for a user
 */
export async function invalidateNotesCache(
  userId: string, 
  noteId?: string,
  options: {
    invalidateSearch?: boolean
    invalidateRelated?: boolean
  } = {}
) {
  const { invalidateSearch = false, invalidateRelated = false } = options

  // Always invalidate user's notes cache
  revalidateTag(CACHE_CONFIG.TAGS.NOTES(userId))

  // Invalidate specific note if provided
  if (noteId) {
    revalidateTag(CACHE_CONFIG.TAGS.NOTE(userId, noteId))
  }

  // Invalidate search cache if requested
  if (invalidateSearch) {
    revalidateTag(CACHE_CONFIG.TAGS.SEARCH(userId))
  }

  // Invalidate related caches if requested
  if (invalidateRelated) {
    revalidateTag(CACHE_CONFIG.TAGS.TAGS(userId))
    revalidateTag(CACHE_CONFIG.TAGS.SEARCH(userId))
  }
}

/**
 * Invalidate search cache for a user
 */
export async function invalidateSearchCache(userId: string) {
  revalidateTag(CACHE_CONFIG.TAGS.SEARCH(userId))
}

/**
 * Invalidate chat cache for a user
 */
export async function invalidateChatCache(userId: string, sessionId?: string) {
  revalidateTag(CACHE_CONFIG.TAGS.CHAT(userId))
  
  if (sessionId) {
    revalidateTag(CACHE_CONFIG.TAGS.CHAT_SESSION(sessionId))
  }
}

/**
 * Advanced cache manager for complex caching scenarios
 */
export class CacheManager {
  private cache: Map<string, { data: any; expiry: number; namespace?: string }> = new Map()
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
  }

  /**
   * Get item from cache
   */
  async get<T = any>(key: string, namespace?: string): Promise<T | null> {
    const cacheKey = this.buildKey(key, namespace)
    const item = this.cache.get(cacheKey)

    if (!item) {
      this.stats.misses++
      return null
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(cacheKey)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return item.data
  }

  /**
   * Set item in cache with TTL
   */
  async set<T = any>(
    key: string, 
    data: T, 
    ttlSeconds: number,
    namespace?: string
  ): Promise<void> {
    const cacheKey = this.buildKey(key, namespace)
    const expiry = Date.now() + (ttlSeconds * 1000)

    this.cache.set(cacheKey, {
      data,
      expiry,
      namespace,
    })

    this.stats.sets++
  }

  /**
   * Remove item from cache
   */
  async invalidate(key: string, namespace?: string): Promise<void> {
    const cacheKey = this.buildKey(key, namespace)
    this.cache.delete(cacheKey)
  }

  /**
   * Remove multiple items by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      hitRate,
      totalKeys: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
    }
  }

  /**
   * Build cache key with optional namespace
   */
  private buildKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  private estimateMemoryUsage(): number {
    let size = 0
    for (const [key, value] of this.cache) {
      size += key.length * 2 // UTF-16 encoding
      size += JSON.stringify(value.data).length * 2
      size += 8 + 32 // expiry number + overhead
    }
    return size
  }
}

/**
 * Query cache for wrapping functions with caching
 */
export class QueryCache {
  private cacheManager = new CacheManager()

  /**
   * Wrap a function with caching
   */
  wrap<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    keyPrefix: string,
    ttlSeconds: number
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      const cacheKey = this.generateKey(keyPrefix, args)
      
      // Try to get from cache first
      const cached = await this.cacheManager.get<TReturn>(cacheKey)
      if (cached !== null) {
        return cached
      }

      // Execute function and cache result
      try {
        const result = await fn(...args)
        await this.cacheManager.set(cacheKey, result, ttlSeconds)
        return result
      } catch (error) {
        // Don't cache errors
        throw error
      }
    }
  }

  /**
   * Batch similar queries together
   */
  batch<TArgs extends any[], TReturn>(
    batchFn: (batchedArgs: TArgs[]) => Promise<TReturn[]>,
    keyPrefix: string,
    options: {
      batchSize?: number
      timeout?: number
    } = {}
  ) {
    const { batchSize = 10, timeout = 50 } = options
    const pendingBatch: { args: TArgs; resolve: (value: TReturn) => void; reject: (error: any) => void }[] = []

    let batchTimer: NodeJS.Timeout | null = null

    return async (...args: TArgs): Promise<TReturn> => {
      return new Promise((resolve, reject) => {
        pendingBatch.push({ args, resolve, reject })

        if (pendingBatch.length >= batchSize) {
          executeBatch()
        } else if (!batchTimer) {
          batchTimer = setTimeout(() => executeBatch(), timeout)
        }
      })

      async function executeBatch() {
        if (batchTimer) {
          clearTimeout(batchTimer)
          batchTimer = null
        }

        const currentBatch = pendingBatch.splice(0)
        if (currentBatch.length === 0) return

        try {
          const batchArgs = currentBatch.map(item => item.args)
          const results = await batchFn(batchArgs)

          currentBatch.forEach((item, index) => {
            if (results[index] !== undefined) {
              item.resolve(results[index])
            } else {
              item.reject(new Error('Batch result not found'))
            }
          })
        } catch (error) {
          currentBatch.forEach(item => item.reject(error))
        }
      }
    }
  }

  /**
   * Prefetch data for faster access
   */
  prefetch<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    keyPrefix: string,
    options: {
      schedule?: 'immediate' | 'defer'
      conditions?: string[]
    } = {}
  ) {
    const { schedule = 'defer' } = options

    return async (...args: TArgs): Promise<void> => {
      const cacheKey = this.generateKey(keyPrefix, args)

      const prefetchFn = async () => {
        try {
          const result = await fn(...args)
          await this.cacheManager.set(cacheKey, result, 300) // 5 minute default TTL
        } catch (error) {
          console.warn('Prefetch failed:', error)
        }
      }

      if (schedule === 'immediate') {
        await prefetchFn()
      } else {
        // Defer to next tick
        process.nextTick(prefetchFn)
      }
    }
  }

  /**
   * Generate cache key from function arguments
   */
  private generateKey<TArgs extends any[]>(keyPrefix: string, args: TArgs): string {
    const argsHash = JSON.stringify(args)
    return `${keyPrefix}:${argsHash}`
  }
}

// Export singleton instances
export const globalCacheManager = new CacheManager()
export const globalQueryCache = new QueryCache()