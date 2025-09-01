export interface ProcessedFile {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pageCount?: number;
  };
}

export async function extractTextFromPDF(buffer: Buffer): Promise<ProcessedFile> {
  try {
    // Dynamic import to avoid build issues
    const pdf = (await import('pdf-parse')).default;
    const data = await pdf(buffer);
    
    return {
      text: data.text.trim(),
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        keywords: data.info?.Keywords,
        creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
        modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined,
        pageCount: data.numpages
      }
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function extractTextFromImage(): Promise<ProcessedFile> {
  // For now, we'll return a placeholder
  // In a real implementation, you'd use OCR services like Google Vision API or Tesseract
  return {
    text: '[Image content - OCR not yet implemented]',
    metadata: {
      title: 'Image Document',
      pageCount: 1
    }
  };
}

export async function extractTextFromDocument(buffer: Buffer, mimeType: string): Promise<ProcessedFile> {
  // For plain text files
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    const text = buffer.toString('utf-8');
    return {
      text: text.trim(),
      metadata: {
        title: 'Text Document',
        pageCount: Math.ceil(text.length / 3000) // Rough page estimate
      }
    };
  }

  // For Word documents - would need additional libraries like mammoth.js
  if (mimeType === 'application/msword' || 
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return {
      text: '[Word document - extraction not yet implemented]',
      metadata: {
        title: 'Word Document',
        pageCount: 1
      }
    };
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

export async function processUploadedFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ProcessedFile> {
  try {
    // Handle PDFs
    if (mimeType === 'application/pdf') {
      return await extractTextFromPDF(buffer);
    }

    // Handle images
    if (mimeType.startsWith('image/')) {
      return await extractTextFromImage();
    }

    // Handle documents
    return await extractTextFromDocument(buffer, mimeType);

  } catch (error) {
    console.error(`Error processing file ${fileName}:`, error);
    throw error;
  }
}

export function generateNoteTitleFromFile(
  fileName: string,
  extractedText: string,
  metadata?: ProcessedFile['metadata']
): string {
  // Use metadata title if available
  if (metadata?.title && metadata.title !== 'Untitled') {
    return metadata.title;
  }

  // Clean up filename to use as title
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const cleanName = nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter of each word
  const titleCase = cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return titleCase || 'Uploaded Document';
}

export function generateSummaryFromText(text: string, maxLength: number = 200): string {
  if (!text || text.trim().length === 0) {
    return 'No content available';
  }

  const trimmedText = text.trim();
  
  if (trimmedText.length <= maxLength) {
    return trimmedText;
  }

  // Find a natural break point (sentence end or paragraph)
  const truncated = trimmedText.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  
  let breakPoint = Math.max(lastPeriod, lastNewline);
  
  if (breakPoint === -1 || breakPoint < maxLength * 0.5) {
    // If no good break point, just truncate at word boundary
    breakPoint = truncated.lastIndexOf(' ');
    if (breakPoint === -1) {
      breakPoint = maxLength;
    }
  }

  return trimmedText.substring(0, breakPoint) + '...';
}