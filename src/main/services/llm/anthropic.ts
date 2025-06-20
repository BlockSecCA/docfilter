import axios from 'axios';

export interface AnthropicConfig {
  api_key: string;
  model?: string;
}

export async function callAnthropic(prompt: string, content: string, config: AnthropicConfig): Promise<{ recommendation: string; reasoning: string }> {
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
            content: `${prompt}\n\nContent to analyze:\n\n${content}`
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