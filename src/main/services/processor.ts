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
  let extractedContent: string;
  
  // Step 1: Extract content based on type
  try {
    extractedContent = await extractContent(input.type, input.source, input.content);
  } catch (error: any) {
    // Content extraction failed - return with minimal info
    return {
      extractedContent: typeof input.content === 'string' ? input.content : input.source,
      recommendation: 'Error',
      summary: 'Content extraction failed',
      reasoning: `Content extraction failed: ${error.message}`,
      provider: 'none',
      model: 'none'
    };
  }
  
  // Step 2: Get current configuration and analyze with LLM
  try {
    const config = await getCurrentConfig();
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
    // LLM analysis failed but we have extracted content - preserve it!
    console.log('LLM analysis failed, preserving extracted content. Error:', error.message);
    
    // Check if it's a token limit error to provide better messaging
    const isTokenLimitError = error.message.toLowerCase().includes('token') || 
                              error.message.toLowerCase().includes('context') ||
                              error.message.toLowerCase().includes('length');
    
    return {
      extractedContent, // Keep the successfully extracted content
      recommendation: 'Error',
      summary: isTokenLimitError ? 'Content too large for AI analysis' : 'AI analysis failed',
      reasoning: isTokenLimitError 
        ? `Document is too large for AI analysis (token limit exceeded). The extracted content is preserved below for manual review. Consider using a more powerful model or splitting the content into smaller sections.`
        : `AI analysis failed: ${error.message}. The extracted content is preserved below for manual review.`,
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