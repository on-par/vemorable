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

// Timeout duration for transcription requests (30 seconds)
const TRANSCRIPTION_TIMEOUT = 30000

// Maximum retry attempts for transient failures
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000 // Base delay in milliseconds

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper function to add exponential backoff delay
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper function to perform transcription with retries
async function transcribeWithRetry(
  file: File,
  retryAttempt = 1
): Promise<OpenAI.Audio.Transcriptions.TranscriptionVerbose> {
  try {
    console.log(`[Transcribe API] Attempting transcription (attempt ${retryAttempt}/${MAX_RETRY_ATTEMPTS})`)
    
    // Create a race condition between transcription and timeout
    const transcriptionPromise = openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json', // Get confidence scores and more details
      language: 'en', // Optional: specify language for better accuracy
    })
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Transcription timeout')), TRANSCRIPTION_TIMEOUT)
    })
    
    const transcription = await Promise.race([transcriptionPromise, timeoutPromise])
    
    console.log(`[Transcribe API] Transcription successful on attempt ${retryAttempt}`)
    return transcription as OpenAI.Audio.Transcriptions.TranscriptionVerbose
  } catch (error) {
    console.error(`[Transcribe API] Transcription failed on attempt ${retryAttempt}:`, error)
    
    // Check if we should retry
    if (retryAttempt < MAX_RETRY_ATTEMPTS) {
      // Check if error is retryable
      const isRetryable = error instanceof OpenAI.APIError && 
        (error.status === 429 || // Rate limit
         error.status === 500 || // Server error
         error.status === 502 || // Bad gateway
         error.status === 503 || // Service unavailable
         error.status === 504) || // Gateway timeout
        (error instanceof Error && error.message === 'Transcription timeout')
      
      if (isRetryable) {
        // Calculate exponential backoff delay
        const backoffDelay = RETRY_DELAY * Math.pow(2, retryAttempt - 1)
        console.log(`[Transcribe API] Retrying after ${backoffDelay}ms delay...`)
        await delay(backoffDelay)
        return transcribeWithRetry(file, retryAttempt + 1)
      }
    }
    
    // If we've exhausted retries or error is not retryable, throw
    throw error
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[Transcribe API] Request received')
  
  try {
    // Authenticate user
    const userId = await getAuthenticatedUserId()
    console.log(`[Transcribe API] User authenticated: ${userId}`)

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Transcribe API] OpenAI API key not configured')
      return errorResponse(
        'OpenAI API key not configured. Please contact support.',
        'CONFIGURATION_ERROR',
        500
      )
    }

    // Parse form data
    console.log('[Transcribe API] Parsing form data...')
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      console.error('[Transcribe API] No audio file provided in request')
      return errorResponse(
        'No audio file provided. Please record or upload an audio file.',
        'MISSING_AUDIO_FILE',
        400
      )
    }

    console.log(`[Transcribe API] Audio file received: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${audioFile.type}`)

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      console.error(`[Transcribe API] File size exceeds limit: ${audioFile.size} bytes`)
      return errorResponse(
        `Audio file is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(audioFile.size / (1024 * 1024)).toFixed(2)}MB.`,
        'FILE_TOO_LARGE',
        400
      )
    }

    // Validate file is not empty
    if (audioFile.size === 0) {
      console.error('[Transcribe API] Audio file is empty')
      return errorResponse(
        'Audio file is empty. Please ensure you have recorded audio before submitting.',
        'EMPTY_FILE',
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
        console.error(`[Transcribe API] Invalid audio format: ${mimeType}, filename: ${fileName}`)
        return errorResponse(
          `Invalid audio format "${mimeType}". Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}. Please use a compatible audio format.`,
          'INVALID_AUDIO_FORMAT',
          400
        )
      }
      console.log(`[Transcribe API] MIME type not recognized (${mimeType}), but file extension is valid`)
    }

    // Convert File to the format OpenAI expects
    console.log('[Transcribe API] Processing audio file for transcription...')
    const buffer = Buffer.from(await audioFile.arrayBuffer())
    
    // Validate buffer is not empty
    if (buffer.length === 0) {
      console.error('[Transcribe API] Audio buffer is empty after conversion')
      return errorResponse(
        'Failed to process audio file. The audio data appears to be corrupted.',
        'INVALID_AUDIO_DATA',
        400
      )
    }
    
    const file = new File([buffer], audioFile.name, { type: audioFile.type })
    console.log(`[Transcribe API] Audio buffer created, size: ${buffer.length} bytes`)

    // Call OpenAI Whisper API for transcription with retry logic
    console.log('[Transcribe API] Sending audio to OpenAI Whisper API...')
    const transcription = await transcribeWithRetry(file)

    // Validate transcription result
    if (!transcription.text || transcription.text.trim().length === 0) {
      console.warn('[Transcribe API] Transcription returned empty text')
      return errorResponse(
        'No speech detected in the audio. Please ensure you speak clearly into the microphone.',
        'NO_SPEECH_DETECTED',
        400
      )
    }

    console.log(`[Transcribe API] Transcription completed successfully. Text length: ${transcription.text.length} characters`)

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
          console.log(`[Transcribe API] Average confidence score: ${(averageConfidence * 100).toFixed(2)}%`)
        }
      }
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime
    console.log(`[Transcribe API] Total processing time: ${processingTime}ms`)

    // Return the transcribed text with metadata
    const responseData = {
      text: transcription.text,
      confidence: averageConfidence,
      language: transcription.language || 'en',
      duration: transcription.duration,
      metadata: {
        model: 'whisper-1',
        timestamp: new Date().toISOString(),
        processingTime: processingTime,
      }
    }
    
    console.log('[Transcribe API] Sending successful response')
    return successResponse(responseData, 200)
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`[Transcribe API] Request failed after ${processingTime}ms:`, error)
    
    // Handle specific OpenAI errors with more descriptive messages
    if (error instanceof OpenAI.APIError) {
      console.error(`[Transcribe API] OpenAI API Error - Status: ${error.status}, Message: ${error.message}`)
      
      if (error.status === 401) {
        return errorResponse(
          'Authentication failed with OpenAI API. Please contact support.',
          'INVALID_API_KEY',
          500
        )
      }
      if (error.status === 429) {
        return errorResponse(
          'We are experiencing high demand. Please wait a moment and try again.',
          'RATE_LIMIT_EXCEEDED',
          429
        )
      }
      if (error.status === 413) {
        return errorResponse(
          'Your audio file is too large for processing. Please record a shorter message (max 25MB).',
          'FILE_TOO_LARGE',
          413
        )
      }
      if (error.status === 500) {
        return errorResponse(
          'OpenAI service is temporarily unavailable. Please try again in a few moments.',
          'SERVICE_UNAVAILABLE',
          503
        )
      }
      if (error.status === 503) {
        return errorResponse(
          'Transcription service is temporarily down for maintenance. Please try again later.',
          'SERVICE_UNAVAILABLE',
          503
        )
      }
    }

    // Handle timeout errors
    if (error instanceof Error && error.message === 'Transcription timeout') {
      return errorResponse(
        'The transcription is taking longer than expected. Please try with a shorter audio recording.',
        'TRANSCRIPTION_TIMEOUT',
        504
      )
    }

    // Handle network errors
    if (error instanceof Error && error.message.includes('fetch failed')) {
      return errorResponse(
        'Network error occurred while processing your audio. Please check your connection and try again.',
        'NETWORK_ERROR',
        503
      )
    }

    return handleApiError(error)
  }
}