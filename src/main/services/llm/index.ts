import { callOpenAI, OpenAIConfig } from './openai';
import { callAnthropic, AnthropicConfig } from './anthropic';
import { callLocalLLM, LocalLLMConfig } from './local';

export interface LLMResult {
  recommendation: string;
  summary: string;
  reasoning: string;
  provider: string;
  model: string;
}

export interface LLMConfig {
  provider: string;
  config: OpenAIConfig | AnthropicConfig | LocalLLMConfig;
}

export async function callLLM(prompt: string, content: string, llmConfig: LLMConfig): Promise<LLMResult> {
  const { provider, config } = llmConfig;
  
  let result: { recommendation: string; summary: string; reasoning: string };
  let model = 'unknown';
  
  switch (provider) {
    case 'openai':
      const openaiConfig = config as OpenAIConfig;
      result = await callOpenAI(prompt, content, openaiConfig);
      model = openaiConfig.model || 'gpt-3.5-turbo';
      break;
      
    case 'anthropic':
      const anthropicConfig = config as AnthropicConfig;  
      result = await callAnthropic(prompt, content, anthropicConfig);
      model = anthropicConfig.model || 'claude-3-haiku-20240307';
      break;
      
    case 'local':
      const localConfig = config as LocalLLMConfig;
      result = await callLocalLLM(prompt, content, localConfig);
      model = localConfig.model || 'local';
      break;
      
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
  
  return {
    ...result,
    provider,
    model
  };
}