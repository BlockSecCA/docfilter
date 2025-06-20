import { extractContent } from './extractors';
import { callLLM } from './llm';
import { getDatabase } from '../database/init';
export async function processArtifact(input) {
    try {
        // Step 1: Extract content based on type
        const extractedContent = await extractContent(input.type, input.source, input.content);
        // Step 2: Get current configuration
        const config = await getCurrentConfig();
        // Step 3: Analyze with LLM
        const llmResult = await callLLM(config.systemPrompt, extractedContent, config.llm);
        return {
            extractedContent,
            recommendation: llmResult.recommendation,
            reasoning: llmResult.reasoning,
            provider: llmResult.provider,
            model: llmResult.model
        };
    }
    catch (error) {
        // If extraction or LLM fails, still store the artifact with error info
        return {
            extractedContent: typeof input.content === 'string' ? input.content : input.source,
            recommendation: 'Error',
            reasoning: `Processing failed: ${error.message}`,
            provider: 'none',
            model: 'none'
        };
    }
}
async function getCurrentConfig() {
    const db = getDatabase();
    return new Promise((resolve, reject) => {
        db.all('SELECT key, value FROM config', (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            const config = {};
            rows.forEach(row => {
                if (row.key === 'providers') {
                    config[row.key] = JSON.parse(row.value);
                }
                else {
                    config[row.key] = row.value;
                }
            });
            // Build LLM config
            const provider = config.default_provider || 'openai';
            const providers = config.providers || {};
            const systemPrompt = config.system_prompt || 'Analyze this content and recommend "Read" or "Discard" with reasoning.';
            if (!providers[provider]) {
                throw new Error(`No configuration found for provider: ${provider}`);
            }
            const llmConfig = {
                provider,
                config: providers[provider]
            };
            resolve({
                systemPrompt,
                llm: llmConfig
            });
        });
    });
}
