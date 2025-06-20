export interface ExtractionResult {
    content: string;
    metadata?: Record<string, any>;
}
export declare function extractContent(type: string, source: string, data?: string | Buffer): Promise<string>;
