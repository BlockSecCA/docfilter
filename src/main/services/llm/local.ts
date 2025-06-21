import axios from 'axios';

export interface LocalLLMConfig {
  endpoint: string;
  model?: string;
}

export async function callLocalLLM(prompt: string, content: string, config: LocalLLMConfig): Promise<{ recommendation: string; summary: string; reasoning: string }> {
  try {
    // Support for Ollama API format
    if (config.endpoint.includes('ollama') || config.endpoint.includes(':11434')) {
      return await callOllama(prompt, content, config);
    }
    
    // Generic OpenAI-compatible API
    return await callGenericAPI(prompt, content, config);
    
  } catch (error: any) {
    throw new Error(`Local LLM request failed: ${error.message}`);
  }
}

async function callOllama(prompt: string, content: string, config: LocalLLMConfig): Promise<{ recommendation: string; summary: string; reasoning: string }> {
  const response = await axios.post(config.endpoint, {
    model: config.model || 'llama2',
    prompt: `${prompt}\n\nPlease provide your response in the following format:\nSUMMARY: [Brief 1-2 sentence summary of the content]\nRECOMMENDATION: [Read or Discard]\nREASONING: [Explanation for your recommendation]\n\nContent to analyze:\n\n${content}`,
    stream: false
  });

  const aiResponse = response.data.response;
  return parseAIResponse(aiResponse);
}

async function callGenericAPI(prompt: string, content: string, config: LocalLLMConfig): Promise<{ recommendation: string; summary: string; reasoning: string }> {
  // Try OpenAI-compatible format first
  try {
    const response = await axios.post(config.endpoint, {
      model: config.model || 'default',
      messages: [
        {
          role: 'system',
          content: prompt + '\n\nPlease provide your response in the following format:\nSUMMARY: [Brief 1-2 sentence summary of the content]\nRECOMMENDATION: [Read or Discard]\nREASONING: [Explanation for your recommendation]'
        },
        {
          role: 'user',
          content: `Please analyze this content:\n\n${content}`
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    const aiResponse = response.data.choices[0].message.content;
    return parseAIResponse(aiResponse);
  } catch (openaiError) {
    // Fallback to simple prompt format
    const response = await axios.post(config.endpoint, {
      prompt: `${prompt}\n\nPlease provide your response in the following format:\nSUMMARY: [Brief 1-2 sentence summary of the content]\nRECOMMENDATION: [Read or Discard]\nREASONING: [Explanation for your recommendation]\n\nContent to analyze:\n\n${content}`,
      max_tokens: 500,
      temperature: 0.1
    });

    const aiResponse = response.data.text || response.data.response || response.data.completion;
    return parseAIResponse(aiResponse);
  }
}

function parseAIResponse(response: string): { recommendation: string; summary: string; reasoning: string } {
  const lines = response.split('\n').filter(line => line.trim());
  
  let recommendation = 'Read'; // Default
  let summary = '';
  let reasoning = response;
  
  // Look for structured format
  for (const line of lines) {
    const trimmedLine = line.trim();
    const lowerLine = trimmedLine.toLowerCase();
    
    if (lowerLine.startsWith('summary:')) {
      summary = trimmedLine.substring(8).trim();
    } else if (lowerLine.startsWith('recommendation:')) {
      const recText = trimmedLine.substring(15).trim().toLowerCase();
      if (recText.includes('discard')) {
        recommendation = 'Discard';
      } else if (recText.includes('read')) {
        recommendation = 'Read';
      }
    } else if (lowerLine.startsWith('reasoning:')) {
      reasoning = trimmedLine.substring(10).trim();
    }
  }
  
  // Fallback: extract from full response if structured format not found
  if (!summary) {
    const sentences = response.split('.').filter(s => s.trim());
    summary = sentences.slice(0, 2).join('.').trim();
    if (summary && !summary.endsWith('.')) summary += '.';
  }
  
  // Fallback: look for recommendation keywords in full response
  if (recommendation === 'Read') {
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes('discard') && !lowerResponse.includes('not discard')) {
      recommendation = 'Discard';
    }
  }
  
  return { 
    recommendation, 
    summary: summary || 'Content analysis summary not available.',
    reasoning: reasoning || response 
  };
}