import { NextRequest } from 'next/server'
import { createServerClientInstance } from '@/lib/supabase'
import {
  successResponse,
  handleApiError,
  getAuthenticatedUserId,
  errorResponse,
} from '@/lib/api-utils'
import { processUploadedFile } from '@/lib/file-processing'

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

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

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

    // Process file to extract text if applicable
    let extractedContent = null;
    try {
      if (file.type === 'application/pdf' || 
          file.type.startsWith('text/') || 
          file.type.startsWith('image/')) {
        const processedFile = await processUploadedFile(
          Buffer.from(buffer),
          file.type,
          file.name
        );
        extractedContent = {
          text: processedFile.text,
          metadata: processedFile.metadata
        };
      }
    } catch (extractError) {
      console.error('Text extraction error:', extractError);
      // Continue without extraction - don't fail the upload
    }

    // Return file information
    return successResponse({
      url: publicUrl,
      path: uploadData.path,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      extractedContent,
      uploadedAt: new Date().toISOString()
    })

  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    const supabase = await createServerClientInstance()

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return errorResponse('No file path provided', 'NO_FILE_PATH', 400)
    }

    // Ensure the file belongs to the current user
    if (!filePath.startsWith(`${userId}/`)) {
      return errorResponse(
        'You are not authorized to delete this file',
        'UNAUTHORIZED',
        403
      )
    }

    // Delete file from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('user-uploads')
      .remove([filePath])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return errorResponse(
        'Failed to delete file',
        'DELETE_FAILED',
        500,
        deleteError
      )
    }

    return successResponse({ deleted: true })

  } catch (error) {
    return handleApiError(error)
  }
}