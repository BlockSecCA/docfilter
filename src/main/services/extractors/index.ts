import { extractPdfContent } from './pdf';
import { extractDocxContent } from './docx';
import { extractWebContent, extractYouTubeTranscript } from './web';

export interface ExtractionResult {
  content: string;
  metadata?: Record<string, any>;
}

export async function extractContent(type: string, source: string, data?: string | Buffer): Promise<string> {
  switch (type) {
    case 'file':
      if (!data) {
        throw new Error('File data is required for file extraction');
      }
      
      if (typeof data === 'string' && data.length === 0) {
        throw new Error('File data is empty');
      }
      
      let buffer: Buffer;
      if (typeof data === 'string') {
        // Check if it's base64 encoded (for binary files from frontend)
        try {
          // Validate base64 format
          if (/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
            buffer = Buffer.from(data, 'base64');
            console.log(`Decoded base64 data: ${buffer.length} bytes for ${source}`);
          } else {
            // Treat as plain text
            buffer = Buffer.from(data, 'utf-8');
            console.log(`Using text data: ${buffer.length} bytes for ${source}`);
          }
        } catch (error) {
          console.error('Base64 decode error:', error);
          // If decode fails, treat as regular text
          buffer = Buffer.from(data, 'utf-8');
        }
      } else {
        buffer = data as Buffer;
        console.log(`Using buffer data: ${buffer.length} bytes for ${source}`);
      }
      
      if (buffer.length === 0) {
        throw new Error('File buffer is empty after processing');
      }
      
      return await extractFileContent(source, buffer);
    
    case 'url':
      if (source.includes('youtube.com') || source.includes('youtu.be')) {
        return await extractYouTubeTranscript(source);
      }
      return await extractWebContent(source);
    
    case 'text':
      return data as string || source;
    
    default:
      throw new Error(`Unsupported extraction type: ${type}`);
  }
}

async function extractFileContent(filename: string, buffer: Buffer): Promise<string> {
  const extension = filename.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'pdf':
      return await extractPdfContent(buffer);
    
    case 'docx':
      return await extractDocxContent(buffer);
    
    case 'txt':
      return buffer.toString('utf-8');
    
    case 'md':
      return buffer.toString('utf-8');
    
    default:
      // For other file types, try to read as text
      try {
        return buffer.toString('utf-8');
      } catch (error) {
        throw new Error(`Unsupported file type: ${extension}`);
      }
  }
}