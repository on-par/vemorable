import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import {
  successResponse,
  handleApiError,
  getAuthenticatedUserId,
  errorResponse,
} from '@/lib/api-utils'

// Audio file validation constants
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB - Whisper API limit
const ALLOWED_AUDIO_FORMATS = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/flac',
]

const ALLOWED_EXTENSIONS = [
  '.mp3',
  '.mp4',
  '.mpeg',
  '.mpga',
  '.m4a',
  '.wav',
  '.webm',
  '.ogg',
  '.flac',
]

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    await getAuthenticatedUserId()

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return errorResponse(
        'OpenAI API key not configured',
        'CONFIGURATION_ERROR',
        500
      )
    }

    // Parse form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return errorResponse(
        'No audio file provided',
        'MISSING_AUDIO_FILE',
        400
      )
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return errorResponse(
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        'FILE_TOO_LARGE',
        400
      )
    }

    // Validate file type by MIME type
    const mimeType = audioFile.type.toLowerCase()
    if (!ALLOWED_AUDIO_FORMATS.includes(mimeType)) {
      // Check by file extension as fallback
      const fileName = audioFile.name.toLowerCase()
      const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
      
      if (!hasValidExtension) {
        return errorResponse(
          `Invalid audio format. Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}`,
          'INVALID_AUDIO_FORMAT',
          400
        )
      }
    }

    // Convert File to the format OpenAI expects
    const buffer = Buffer.from(await audioFile.arrayBuffer())
    const file = new File([buffer], audioFile.name, { type: audioFile.type })

    // Call OpenAI Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json', // Get confidence scores and more details
      language: 'en', // Optional: specify language for better accuracy
    })

    // Extract confidence score if available
    // Note: The verbose_json format includes segments with confidence scores
    let averageConfidence: number | undefined = undefined
    
    if ('segments' in transcription && Array.isArray(transcription.segments)) {
      const segments = transcription.segments as Array<{ 
        avg_logprob?: number
        no_speech_prob?: number 
      }>
      
      if (segments.length > 0) {
        // Calculate average confidence from log probabilities
        // Convert log probability to confidence score (0-1 range)
        const confidences = segments
          .filter(seg => typeof seg.avg_logprob === 'number')
          .map(seg => Math.exp(seg.avg_logprob!))
        
        if (confidences.length > 0) {
          averageConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length
        }
      }
    }

    // Return the transcribed text with metadata
    return successResponse({
      text: transcription.text,
      confidence: averageConfidence,
      language: transcription.language || 'en',
      duration: transcription.duration,
      metadata: {
        model: 'whisper-1',
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return errorResponse(
          'Invalid OpenAI API key',
          'INVALID_API_KEY',
          500
        )
      }
      if (error.status === 429) {
        return errorResponse(
          'OpenAI API rate limit exceeded. Please try again later.',
          'RATE_LIMIT_EXCEEDED',
          429
        )
      }
      if (error.status === 413) {
        return errorResponse(
          'Audio file is too large for processing',
          'FILE_TOO_LARGE',
          413
        )
      }
    }

    return handleApiError(error)
  }
}