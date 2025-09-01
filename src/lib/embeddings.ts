import { openai } from './openai'

export interface EmbeddingResult {
  embedding: number[]
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

/**
 * Generate an embedding vector for a given text using OpenAI's embedding model
 * @param text - The text to generate an embedding for
 * @returns An embedding result containing the vector and metadata
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text is empty or invalid')
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.trim(),
    })

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding data returned from OpenAI')
    }

    const embedding = response.data[0].embedding
    
    return {
      embedding,
      model: response.model,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      }
    }
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of embedding results
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  if (!texts || texts.length === 0) {
    throw new Error('No texts provided for embedding generation')
  }

  const validTexts = texts.filter(text => text && text.trim().length > 0)
  
  if (validTexts.length === 0) {
    throw new Error('All provided texts are empty or invalid')
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: validTexts.map(text => text.trim()),
    })

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding data returned from OpenAI')
    }

    return response.data.map((data) => ({
      embedding: data.embedding,
      model: response.model,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      }
    }))
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate an embedding for a search query (potentially with query expansion)
 * @param query - The search query text
 * @returns An embedding result for the query
 */
export async function generateQueryEmbedding(query: string): Promise<EmbeddingResult> {
  if (!query || query.trim().length === 0) {
    throw new Error('Query is empty or invalid')
  }

  // For search queries, we might want to preprocess or expand the query
  // For now, we'll just trim and use as-is
  const processedQuery = query.trim()

  try {
    return await generateEmbedding(processedQuery)
  } catch (error) {
    console.error('Error generating query embedding:', error)
    throw new Error(`Failed to generate query embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate an embedding for note content by combining different parts
 * @param title - The note title
 * @param content - The note content
 * @param tags - Optional tags array
 * @returns An embedding result for the combined note content
 */
export async function generateNoteEmbedding(
  title: string,
  content: string,
  tags?: string[]
): Promise<EmbeddingResult> {
  // Combine different parts of the note for a more comprehensive embedding
  const parts: string[] = []
  
  if (title && title.trim()) {
    parts.push(`Title: ${title.trim()}`)
  }
  
  if (content && content.trim()) {
    parts.push(`Content: ${content.trim()}`)
  }
  
  if (tags && tags.length > 0) {
    const validTags = tags.filter(tag => tag && tag.trim())
    if (validTags.length > 0) {
      parts.push(`Tags: ${validTags.join(', ')}`)
    }
  }

  if (parts.length === 0) {
    throw new Error('No valid content provided for note embedding')
  }

  const combinedText = parts.join('\n\n')
  
  try {
    return await generateEmbedding(combinedText)
  } catch (error) {
    console.error('Error generating note embedding:', error)
    throw new Error(`Failed to generate note embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Convert an embedding array to a PostgreSQL vector string format
 * @param embedding - The embedding array
 * @returns A string formatted for PostgreSQL pgvector
 */
export function formatEmbeddingForPgVector(embedding: number[]): string {
  if (!embedding || embedding.length === 0) {
    throw new Error('Invalid embedding array')
  }
  
  // Format as [0.1, 0.2, 0.3, ...] for PostgreSQL
  return `[${embedding.join(',')}]`
}

/**
 * Parse a PostgreSQL vector string back to a number array
 * @param pgVector - The PostgreSQL vector string
 * @returns The embedding as a number array
 */
export function parseEmbeddingFromPgVector(pgVector: string): number[] {
  if (!pgVector || pgVector.trim().length === 0) {
    throw new Error('Invalid pgvector string')
  }
  
  try {
    // Remove brackets and parse
    const cleaned = pgVector.replace(/[\[\]]/g, '')
    const values = cleaned.split(',').map(v => parseFloat(v.trim()))
    
    if (values.some(isNaN)) {
      throw new Error('Invalid numeric values in pgvector string')
    }
    
    return values
  } catch (error) {
    console.error('Error parsing pgvector string:', error)
    throw new Error(`Failed to parse pgvector string: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}