import pdfParse from 'pdf-parse';
export async function extractPdfContent(buffer) {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    }
    catch (error) {
        throw new Error(`Failed to extract PDF content: ${error.message}`);
    }
}
