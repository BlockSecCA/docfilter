import axios from 'axios';

export interface OpenAIConfig {
  api_key: string;
  model?: string;
}

export async function callOpenAI(prompt: string, content: string, config: OpenAIConfig): Promise<{ recommendation: string; summary: string; reasoning: string }> {
  const model = config.model || 'gpt-3.5-turbo';
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
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
      },
      {
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    return parseAIResponse(aiResponse);
  } catch (error: any) {
    if (error.response) {
      throw new Error(`OpenAI API error: ${error.response.data.error?.message || error.response.statusText}`);
    }
    throw new Error(`OpenAI request failed: ${error.message}`);
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