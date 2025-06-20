import pdfParse from 'pdf-parse';

export async function extractPdfContent(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error: any) {
    throw new Error(`Failed to extract PDF content: ${error.message}`);
  }
}