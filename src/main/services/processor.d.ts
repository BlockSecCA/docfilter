export interface ProcessingResult {
    extractedContent: string;
    recommendation: string;
    reasoning: string;
    provider: string;
    model: string;
}
export interface ArtifactInput {
    type: string;
    content: string | Buffer;
    source: string;
}
export declare function processArtifact(input: ArtifactInput): Promise<ProcessingResult>;
