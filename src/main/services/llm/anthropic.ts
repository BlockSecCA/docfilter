import axios from 'axios';

export interface AnthropicConfig {
  api_key: string;
  model?: string;
}

export async function callAnthropic(prompt: string, content: string, config: AnthropicConfig): Promise<{ recommendation: string; summary: string; reasoning: string }> {
  const model = config.model || 'claude-3-haiku-20240307';
  
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nPlease provide your response in the following format:\nSUMMARY: [Brief 1-2 sentence summary of the content]\nRECOMMENDATION: [Read or Discard]\nREASONING: [Explanation for your recommendation]\n\nContent to analyze:\n\n${content}`
          }
        ]
      },
      {
        headers: {
          'x-api-key': config.api_key,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    const aiResponse = response.data.content[0].text;
    return parseAIResponse(aiResponse);
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Anthropic API error: ${error.response.data.error?.message || error.response.statusText}`);
    }
    throw new Error(`Anthropic request failed: ${error.message}`);
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