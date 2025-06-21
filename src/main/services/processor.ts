import { extractContent } from './extractors';
import { callLLM, LLMConfig } from './llm';
import { getDatabase } from '../database/init';

// Simple token estimation: ~4 characters per token for English text
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function truncateToTokenLimit(text: string, maxTokens: number): { content: string; wasTruncated: boolean } {
  const estimatedTokens = estimateTokens(text);
  
  if (estimatedTokens <= maxTokens) {
    return { content: text, wasTruncated: false };
  }
  
  // Truncate to roughly fit token limit, leaving some buffer for system prompt
  const targetChars = Math.floor(maxTokens * 4 * 0.8); // 80% of limit for safety
  const truncated = text.substring(0, targetChars) + '\n\n[Content truncated due to length...]';
  
  return { content: truncated, wasTruncated: true };
}

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
    
    // Truncate content if it exceeds max tokens
    const { content: contentForLLM, wasTruncated } = truncateToTokenLimit(extractedContent, config.maxTokens);
    
    console.log(`Content size: ${estimateTokens(extractedContent)} estimated tokens, max: ${config.maxTokens}, truncated: ${wasTruncated}`);
    
    const llmResult = await callLLM(config.systemPrompt, contentForLLM, config.llm);
    
    // Add note about truncation to reasoning if content was truncated
    let reasoning = llmResult.reasoning;
    if (wasTruncated) {
      reasoning = `Note: Content was truncated to fit token limits (analyzed first ${Math.floor(config.maxTokens * 0.8)} tokens). Full content is preserved below.\n\n${reasoning}`;
    }
    
    return {
      extractedContent, // Always return full extracted content
      recommendation: llmResult.recommendation,
      summary: llmResult.summary,
      reasoning,
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

async function getCurrentConfig(): Promise<{ systemPrompt: string; llm: LLMConfig; maxTokens: number }> {
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
      const maxTokens = parseInt(config.max_tokens || '100000', 10);
      
      if (!providers[provider]) {
        throw new Error(`No configuration found for provider: ${provider}`);
      }
      
      const llmConfig: LLMConfig = {
        provider,
        config: providers[provider]
      };
      
      resolve({
        systemPrompt,
        llm: llmConfig,
        maxTokens
      });
    });
  });
}