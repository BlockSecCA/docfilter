export interface AnthropicConfig {
    api_key: string;
    model?: string;
}
export declare function callAnthropic(prompt: string, content: string, config: AnthropicConfig): Promise<{
    recommendation: string;
    reasoning: string;
}>;
