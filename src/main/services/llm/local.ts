import axios from 'axios';

export interface LocalLLMConfig {
  endpoint: string;
  model?: string;
}

export async function callLocalLLM(prompt: string, content: string, config: LocalLLMConfig): Promise<{ recommendation: string; reasoning: string }> {
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

async function callOllama(prompt: string, content: string, config: LocalLLMConfig): Promise<{ recommendation: string; reasoning: string }> {
  const response = await axios.post(config.endpoint, {
    model: config.model || 'llama2',
    prompt: `${prompt}\n\nContent to analyze:\n\n${content}`,
    stream: false
  });

  const aiResponse = response.data.response;
  return parseAIResponse(aiResponse);
}

async function callGenericAPI(prompt: string, content: string, config: LocalLLMConfig): Promise<{ recommendation: string; reasoning: string }> {
  // Try OpenAI-compatible format first
  try {
    const response = await axios.post(config.endpoint, {
      model: config.model || 'default',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: `Please analyze this content and provide your recommendation:\n\n${content}`
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
      prompt: `${prompt}\n\nContent to analyze:\n\n${content}`,
      max_tokens: 500,
      temperature: 0.1
    });

    const aiResponse = response.data.text || response.data.response || response.data.completion;
    return parseAIResponse(aiResponse);
  }
}

function parseAIResponse(response: string): { recommendation: string; reasoning: string } {
  // Try to extract structured response
  const lines = response.split('\n').filter(line => line.trim());
  
  let recommendation = 'Read'; // Default
  let reasoning = response;
  
  // Look for patterns like "Recommendation: Read" or "Decision: Discard"
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('recommendation:') || lowerLine.includes('decision:')) {
      if (lowerLine.includes('discard') || lowerLine.includes('skip') || lowerLine.includes('ignore')) {
        recommendation = 'Discard';
      } else if (lowerLine.includes('read') || lowerLine.includes('review') || lowerLine.includes('valuable')) {
        recommendation = 'Read';
      }
      break;
    }
  }
  
  // Look for the word "discard" or "read" in the response
  const lowerResponse = response.toLowerCase();
  if (lowerResponse.includes('discard') && !lowerResponse.includes('not discard')) {
    recommendation = 'Discard';
  } else if (lowerResponse.includes('read') || lowerResponse.includes('valuable') || lowerResponse.includes('useful')) {
    recommendation = 'Read';
  }
  
  return { recommendation, reasoning };
}