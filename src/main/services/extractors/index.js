import { extractPdfContent } from './pdf';
import { extractDocxContent } from './docx';
import { extractWebContent, extractYouTubeTranscript } from './web';
export async function extractContent(type, source, data) {
    switch (type) {
        case 'file':
            if (!data || typeof data === 'string') {
                throw new Error('File data is required for file extraction');
            }
            return await extractFileContent(source, data);
        case 'url':
            if (source.includes('youtube.com') || source.includes('youtu.be')) {
                return await extractYouTubeTranscript(source);
            }
            return await extractWebContent(source);
        case 'text':
            return data || source;
        default:
            throw new Error(`Unsupported extraction type: ${type}`);
    }
}
async function extractFileContent(filename, buffer) {
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
            }
            catch (error) {
                throw new Error(`Unsupported file type: ${extension}`);
            }
    }
}
