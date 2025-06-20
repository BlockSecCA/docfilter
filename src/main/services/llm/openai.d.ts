export interface OpenAIConfig {
    api_key: string;
    model?: string;
}
export declare function callOpenAI(prompt: string, content: string, config: OpenAIConfig): Promise<{
    recommendation: string;
    reasoning: string;
}>;
