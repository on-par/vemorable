import { NextRequest } from 'next/server'
import { createServerClientInstance } from '@/lib/supabase'
import {
  successResponse,
  handleApiError,
  getAuthenticatedUserId,
  errorResponse,
} from '@/lib/api-utils'
import { processUploadedFile, generateNoteTitleFromFile, generateSummaryFromText } from '@/lib/file-processing'
import { processNoteWithAI } from '@/lib/openai'
import { generateNoteEmbedding, formatEmbeddingForPgVector } from '@/lib/embeddings'
import { Database } from '@/types/database'

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = await createServerClientInstance()

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const processWithAI = formData.get('processWithAI') === 'true'

    if (!file) {
      return errorResponse('No file provided', 'NO_FILE', 400)
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse(
        `File type ${file.type} is not supported`,
        'INVALID_FILE_TYPE',
        400
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
        'FILE_TOO_LARGE',
        400
      )
    }

    // Generate unique file path with user folder
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Convert File to ArrayBuffer for processing
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from file
    let extractedContent;
    try {
      extractedContent = await processUploadedFile(buffer, file.type, file.name);
    } catch (extractError) {
      console.error('Text extraction error:', extractError);
      return errorResponse(
        'Failed to extract text from file',
        'EXTRACTION_FAILED',
        500,
        extractError
      )
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return errorResponse(
        'Failed to upload file',
        'UPLOAD_FAILED',
        500,
        uploadError
      )
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath)

    // Process the extracted text
    let noteTitle = generateNoteTitleFromFile(file.name, extractedContent.text, extractedContent.metadata);
    let noteSummary = generateSummaryFromText(extractedContent.text);
    let processedContent = extractedContent.text;
    let tags: string[] = [];

    // If AI processing is requested, use OpenAI to enhance the note
    if (processWithAI && extractedContent.text && extractedContent.text.length > 10) {
      try {
        const aiProcessed = await processNoteWithAI(extractedContent.text);
        noteTitle = aiProcessed.title || noteTitle;
        noteSummary = aiProcessed.summary || noteSummary;
        processedContent = aiProcessed.cleanedTranscript || processedContent;
        tags = aiProcessed.tags || [];
      } catch (aiError) {
        console.error('AI processing error:', aiError);
        // Continue with basic extraction if AI fails
      }
    }

    // Generate embedding for the note
    let embeddingVector: string | null = null;
    try {
      const embeddingResult = await generateNoteEmbedding(
        noteTitle,
        processedContent,
        tags
      );
      embeddingVector = formatEmbeddingForPgVector(embeddingResult.embedding);
    } catch (embeddingError) {
      console.error('Failed to generate embedding:', embeddingError);
      // Continue without embedding
    }

    // Create the note in the database
    const noteData: Database['public']['Tables']['notes']['Insert'] = {
      user_id: userId,
      title: noteTitle,
      raw_transcript: extractedContent.text.substring(0, 10000), // Limit to 10k chars
      processed_content: processedContent.substring(0, 10000),
      summary: noteSummary,
      tags: tags,
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      embedding: embeddingVector,
    };

    const { data: note, error: noteError } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('notes') as any)
      .insert(noteData)
      .select()
      .single();

    if (noteError) {
      // Try to clean up the uploaded file if note creation fails
      await supabase.storage
        .from('user-uploads')
        .remove([filePath]);
      
      throw noteError;
    }

    return successResponse({
      note,
      file: {
        url: publicUrl,
        path: uploadData.path,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
      extraction: {
        textLength: extractedContent.text.length,
        metadata: extractedContent.metadata,
        processedWithAI: processWithAI
      }
    }, 201);

  } catch (error) {
    return handleApiError(error);
  }
}