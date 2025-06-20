export interface LocalLLMConfig {
    endpoint: string;
    model?: string;
}
export declare function callLocalLLM(prompt: string, content: string, config: LocalLLMConfig): Promise<{
    recommendation: string;
    reasoning: string;
}>;
