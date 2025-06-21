import pdfParse from 'pdf-parse';

export async function extractPdfContent(buffer: Buffer): Promise<string> {
  try {
    console.log(`PDF extraction starting, buffer size: ${buffer.length} bytes`);
    
    // Check if buffer looks like a PDF
    const pdfHeader = buffer.toString('ascii', 0, 8);
    console.log(`PDF header: "${pdfHeader}"`);
    
    if (!pdfHeader.startsWith('%PDF-')) {
      throw new Error(`Invalid PDF header: "${pdfHeader}" - not a valid PDF file`);
    }
    
    console.log('Calling pdf-parse library...');
    const data = await pdfParse(buffer);
    console.log(`PDF extraction successful, text length: ${data.text.length} characters`);
    console.log(`PDF text preview (first 200 chars): "${data.text.substring(0, 200)}"`);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF extraction returned empty text - possibly a scanned/image-only PDF');
    }
    
    return data.text;
  } catch (error: any) {
    console.error('PDF extraction error:', error.message);
    console.error('PDF extraction error stack:', error.stack);
    throw new Error(`Failed to extract PDF content: ${error.message}`);
  }
}