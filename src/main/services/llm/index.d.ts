import { OpenAIConfig } from './openai';
import { AnthropicConfig } from './anthropic';
import { LocalLLMConfig } from './local';
export interface LLMResult {
    recommendation: string;
    reasoning: string;
    provider: string;
    model: string;
}
export interface LLMConfig {
    provider: string;
    config: OpenAIConfig | AnthropicConfig | LocalLLMConfig;
}
export declare function callLLM(prompt: string, content: string, llmConfig: LLMConfig): Promise<LLMResult>;
