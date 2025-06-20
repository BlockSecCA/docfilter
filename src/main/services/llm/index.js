import { callOpenAI } from './openai';
import { callAnthropic } from './anthropic';
import { callLocalLLM } from './local';
export async function callLLM(prompt, content, llmConfig) {
    const { provider, config } = llmConfig;
    let result;
    let model = 'unknown';
    switch (provider) {
        case 'openai':
            const openaiConfig = config;
            result = await callOpenAI(prompt, content, openaiConfig);
            model = openaiConfig.model || 'gpt-3.5-turbo';
            break;
        case 'anthropic':
            const anthropicConfig = config;
            result = await callAnthropic(prompt, content, anthropicConfig);
            model = anthropicConfig.model || 'claude-3-haiku-20240307';
            break;
        case 'local':
            const localConfig = config;
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
