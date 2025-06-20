import * as mammoth from 'mammoth';

export async function extractDocxContent(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error: any) {
    throw new Error(`Failed to extract DOCX content: ${error.message}`);
  }
}