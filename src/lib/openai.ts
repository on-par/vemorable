import OpenAI from 'openai'

// Create openai instance
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ProcessedNote {
  cleanedTranscript: string
  title: string
  summary: string
  tags: string[]
}

export interface TranscriptCleanupResult {
  cleanedText: string
}

export interface TitleSummaryResult {
  title: string
  summary: string
}

export interface TagsResult {
  tags: string[]
}

export async function cleanupTranscript(rawTranscript: string): Promise<TranscriptCleanupResult> {
  if (!rawTranscript || rawTranscript.trim().length === 0) {
    throw new Error('Transcript is empty')
  }

  try {
    // Create fresh instance to allow for mocking in tests
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a transcript cleanup assistant. Your task is to:
1. Remove filler words (um, uh, like, you know, etc.)
2. Fix grammar and punctuation
3. Maintain the original meaning and tone
4. Keep proper nouns and technical terms intact
5. Format the text into clear paragraphs
6. Do not add any new information or context
7. Return only the cleaned transcript without any additional commentary`
        },
        {
          role: 'user',
          content: rawTranscript
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const cleanedText = completion.choices[0]?.message?.content || rawTranscript

    return {
      cleanedText: cleanedText.trim()
    }
  } catch (error) {
    console.error('Error cleaning transcript:', error)
    throw new Error('Failed to clean transcript')
  }
}

export async function generateTitleAndSummary(content: string): Promise<TitleSummaryResult> {
  if (!content || content.trim().length === 0) {
    throw new Error('Content is empty')
  }

  try {
    // Create fresh instance to allow for mocking in tests
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a note analysis assistant. Given a note's content, generate:
1. A concise, descriptive title (max 60 characters)
2. A brief summary (2-3 sentences, max 200 characters)

Return your response in the following JSON format:
{
  "title": "Your generated title here",
  "summary": "Your generated summary here"
}

Important: Return ONLY valid JSON, no additional text or markdown formatting.`
        },
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.5,
      max_tokens: 200,
      response_format: { type: "json_object" }
    })

    const responseContent = completion.choices[0]?.message?.content || '{}'
    
    try {
      const parsed = JSON.parse(responseContent) as TitleSummaryResult
      
      if (!parsed.title || !parsed.summary) {
        throw new Error('Invalid response structure')
      }

      return {
        title: parsed.title.substring(0, 60),
        summary: parsed.summary.substring(0, 200)
      }
    } catch (parseError) {
      console.error('Error parsing title/summary response:', parseError)
      throw new Error('Failed to generate title and summary')
    }
  } catch (error) {
    console.error('Error generating title and summary:', error)
    throw new Error('Failed to generate title and summary')
  }
}

export async function generateTags(content: string): Promise<TagsResult> {
  if (!content || content.trim().length === 0) {
    throw new Error('Content is empty')
  }

  try {
    // Create fresh instance to allow for mocking in tests
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a tagging assistant. Analyze the given content and generate relevant tags.

Rules:
1. Generate 3-7 relevant tags
2. Tags should be single words or short phrases (max 20 characters each)
3. Use lowercase only
4. Focus on main topics, themes, and key concepts
5. Include relevant categories or domains

Return your response in the following JSON format:
{
  "tags": ["tag1", "tag2", "tag3"]
}

Important: Return ONLY valid JSON, no additional text or markdown formatting.`
        },
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.6,
      max_tokens: 150,
      response_format: { type: "json_object" }
    })

    const responseContent = completion.choices[0]?.message?.content || '{}'
    
    try {
      const parsed = JSON.parse(responseContent) as TagsResult
      
      if (!Array.isArray(parsed.tags)) {
        throw new Error('Invalid response structure')
      }

      // Validate and clean tags
      const cleanedTags = parsed.tags
        .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
        .map(tag => tag.toLowerCase().trim().substring(0, 20))
        .slice(0, 7) // Maximum 7 tags

      return {
        tags: cleanedTags
      }
    } catch (parseError) {
      console.error('Error parsing tags response:', parseError)
      throw new Error('Failed to generate tags')
    }
  } catch (error) {
    console.error('Error generating tags:', error)
    throw new Error('Failed to generate tags')
  }
}

export async function processNoteWithAI(transcript: string): Promise<ProcessedNote> {
  try {
    // Step 1: Clean up the transcript
    const { cleanedText } = await cleanupTranscript(transcript)
    
    // Step 2: Generate title and summary from cleaned transcript
    const { title, summary } = await generateTitleAndSummary(cleanedText)
    
    // Step 3: Generate tags from cleaned transcript
    const { tags } = await generateTags(cleanedText)
    
    return {
      cleanedTranscript: cleanedText,
      title,
      summary,
      tags
    }
  } catch (error) {
    console.error('Error processing note with AI:', error)
    throw error
  }
}

// openai is already exported above