import { NextRequest } from 'next/server'
import { openai } from '@/lib/openai'
import { createServerClientInstance } from '@/lib/supabase'
import {
  successResponse,
  handleApiError,
  getAuthenticatedUserId,
} from '@/lib/api-utils'
import { generateQueryEmbedding, formatEmbeddingForPgVector } from '@/lib/embeddings'
import { z } from 'zod'

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid().optional().nullable(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
})

interface Note {
  id: string;
  title: string;
  processed_content: string;
  summary: string;
  tags: string[];
  similarity?: number;
}

async function searchRelevantNotes(
  query: string, 
  userId: string,
  limit: number = 5,
  threshold: number = 0.5
): Promise<Note[]> {
  const supabase = await createServerClientInstance()
  
  try {
    // Generate embedding for the query
    const queryEmbeddingResult = await generateQueryEmbedding(query)
    const queryVector = formatEmbeddingForPgVector(queryEmbeddingResult.embedding)
    
    // Search for relevant notes using vector similarity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: results, error } = await (supabase as any).rpc('search_notes', {
      query_embedding: queryVector,
      match_threshold: threshold,
      match_count: limit,
      user_id_filter: userId,
    })
    
    if (error) {
      console.error('Note search error:', error)
      return []
    }
    
    return results || []
  } catch (error) {
    console.error('Failed to search notes:', error)
    return []
  }
}

function buildContextFromNotes(notes: Note[]): string {
  if (notes.length === 0) {
    return 'No relevant notes found in the knowledge base.'
  }
  
  const contextParts = notes.map((note, index) => {
    const tags = note.tags && note.tags.length > 0 ? `Tags: ${note.tags.join(', ')}` : ''
    const similarity = note.similarity ? `(Relevance: ${(note.similarity * 100).toFixed(1)}%)` : ''
    
    return `
Note ${index + 1}: ${note.title} ${similarity}
${tags}
Summary: ${note.summary}
Content: ${note.processed_content}
---`
  })
  
  return `Here are the most relevant notes from your knowledge base:

${contextParts.join('\n')}

Use this context to answer the user's question. If the notes don't contain relevant information, you can still provide a helpful response based on general knowledge, but mention that you couldn't find specific information in their notes.`
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    const body = await request.json()
    const validatedData = chatRequestSchema.parse(body)
    
    // Search for relevant notes based on the user's message
    const relevantNotes = await searchRelevantNotes(
      validatedData.message,
      userId,
      5, // Get top 5 most relevant notes
      0.3 // Lower threshold to get more context
    )
    
    // Build context from the relevant notes
    const notesContext = buildContextFromNotes(relevantNotes)
    
    // Prepare the conversation history
    const conversationHistory = validatedData.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))
    
    // Create the chat completion with context
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant that helps users interact with their note-taking system. 
You have access to the user's notes and can help them:
- Find information from their notes
- Summarize collections of notes
- Identify connections between different notes
- Answer questions based on their stored knowledge
- Provide insights from their notes

When answering questions:
1. Always prioritize information from the user's notes
2. If relevant notes are found, reference them in your response
3. If no relevant notes are found, mention this and provide general assistance
4. Be conversational and helpful
5. Keep responses concise but informative

Current context from user's notes will be provided with each query.`,
        },
        {
          role: 'system',
          content: notesContext,
        },
        ...conversationHistory,
        {
          role: 'user',
          content: validatedData.message,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })
    
    const responseContent = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.'
    
    // Save the conversation to the session if sessionId is provided
    if (validatedData.sessionId) {
      const supabase = await createServerClientInstance()
      
      // Save user message
      await supabase
        .from('chat_messages')
        .insert({
          session_id: validatedData.sessionId,
          role: 'user',
          content: validatedData.message,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      
      // Save assistant response
      await supabase
        .from('chat_messages')
        .insert({
          session_id: validatedData.sessionId,
          role: 'assistant',
          content: responseContent,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
    }
    
    return successResponse({
      response: responseContent,
      notesUsed: relevantNotes.length,
      sessionId: validatedData.sessionId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}