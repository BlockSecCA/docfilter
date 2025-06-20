import * as mammoth from 'mammoth';
export async function extractDocxContent(buffer) {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }
    catch (error) {
        throw new Error(`Failed to extract DOCX content: ${error.message}`);
    }
}
