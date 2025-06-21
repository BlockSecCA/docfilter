import { extractContent } from './extractors';
import { callLLM, LLMConfig } from './llm';
import { getDatabase } from '../database/init';

export interface ProcessingResult {
  extractedContent: string;
  recommendation: string;
  summary: string;
  reasoning: string;
  provider: string;
  model: string;
}

export interface ArtifactInput {
  type: string;
  content: string | Buffer;
  source: string;
}

export async function processArtifact(input: ArtifactInput): Promise<ProcessingResult> {
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
      summary: llmResult.summary,
      reasoning: llmResult.reasoning,
      provider: llmResult.provider,
      model: llmResult.model
    };
  } catch (error: any) {
    // If extraction or LLM fails, still store the artifact with error info
    return {
      extractedContent: typeof input.content === 'string' ? input.content : input.source,
      recommendation: 'Error',
      summary: 'Processing failed',
      reasoning: `Processing failed: ${error.message}`,
      provider: 'none',
      model: 'none'
    };
  }
}

async function getCurrentConfig(): Promise<{ systemPrompt: string; llm: LLMConfig }> {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    db.all('SELECT key, value FROM config', (err, rows: any[]) => {
      if (err) {
        reject(err);
        return;
      }
      
      const config: any = {};
      rows.forEach(row => {
        if (row.key === 'providers') {
          config[row.key] = JSON.parse(row.value);
        } else {
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
      
      const llmConfig: LLMConfig = {
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