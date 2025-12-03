/**
 * Embedding utilities for semantic search
 * Note: Actual embedding generation happens in Edge Functions
 * This file contains client-side helpers
 */

/**
 * Embedding model configuration
 */
export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);

  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}

/**
 * Format similarity score for display
 */
export function formatSimilarity(similarity: number): string {
  return `${Math.round(similarity * 100)}% match`;
}

/**
 * Determine relevance level based on similarity score
 */
export function getRelevanceLevel(similarity: number): 'high' | 'medium' | 'low' {
  if (similarity >= 0.8) {
    return 'high';
  }
  if (similarity >= 0.5) {
    return 'medium';
  }
  return 'low';
}

/**
 * Prepare text for embedding
 * Cleans and normalizes text before embedding
 */
export function prepareTextForEmbedding(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 8000); // OpenAI has a token limit
}
