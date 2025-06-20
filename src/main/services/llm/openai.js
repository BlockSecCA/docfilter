import axios from 'axios';
export async function callOpenAI(prompt, content, config) {
    const model = config.model || 'gpt-3.5-turbo';
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model,
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
        }, {
            headers: {
                'Authorization': `Bearer ${config.api_key}`,
                'Content-Type': 'application/json'
            }
        });
        const aiResponse = response.data.choices[0].message.content;
        return parseAIResponse(aiResponse);
    }
    catch (error) {
        if (error.response) {
            throw new Error(`OpenAI API error: ${error.response.data.error?.message || error.response.statusText}`);
        }
        throw new Error(`OpenAI request failed: ${error.message}`);
    }
}
function parseAIResponse(response) {
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
            }
            else if (lowerLine.includes('read') || lowerLine.includes('review') || lowerLine.includes('valuable')) {
                recommendation = 'Read';
            }
            break;
        }
    }
    // Look for the word "discard" or "read" in the response
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes('discard') && !lowerResponse.includes('not discard')) {
        recommendation = 'Discard';
    }
    else if (lowerResponse.includes('read') || lowerResponse.includes('valuable') || lowerResponse.includes('useful')) {
        recommendation = 'Read';
    }
    return { recommendation, reasoning };
}
