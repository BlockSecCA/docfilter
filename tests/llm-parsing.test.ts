import { callOpenAI } from '../src/main/services/llm/openai';
import { callAnthropic } from '../src/main/services/llm/anthropic';
import { callLLM } from '../src/main/services/llm/index';

// Mock axios to avoid real API calls
jest.mock('axios');
const mockAxios = require('axios');

describe('LLM Response Parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OpenAI Response Parsing', () => {
    it('should parse structured response correctly', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: `SUMMARY: This is a technical article about React hooks.
RECOMMENDATION: Read
REASONING: The content provides valuable insights into modern React development patterns that would be useful for developers.`
            }
          }]
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await callOpenAI(
        'Analyze this content',
        'React hooks content...',
        { api_key: 'test-key', model: 'gpt-3.5-turbo' }
      );

      expect(result).toEqual({
        recommendation: 'Read',
        summary: 'This is a technical article about React hooks.',
        reasoning: 'The content provides valuable insights into modern React development patterns that would be useful for developers.'
      });
    });

    it('should handle Discard recommendation', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: `SUMMARY: This is a spam email with no valuable content.
RECOMMENDATION: Discard
REASONING: The content is promotional spam with no educational or informational value.`
            }
          }]
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await callOpenAI(
        'Analyze this content',
        'Spam email content...',
        { api_key: 'test-key' }
      );

      expect(result.recommendation).toBe('Discard');
      expect(result.summary).toBe('This is a spam email with no valuable content.');
    });

    it('should handle unstructured response with fallbacks', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: `This article discusses machine learning concepts. It covers neural networks and deep learning algorithms. The content is quite technical but informative. I would recommend reading this as it contains valuable information for AI practitioners.`
            }
          }]
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await callOpenAI(
        'Analyze this content',
        'ML article...',
        { api_key: 'test-key' }
      );

      expect(result.recommendation).toBe('Read');
      expect(result.summary).toContain('This article discusses machine learning concepts');
      expect(result.reasoning).toContain('machine learning concepts');
    });

    it('should detect discard keyword in unstructured response', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: `This content is low quality and I would discard it as it provides no useful information.`
            }
          }]
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await callOpenAI(
        'Analyze this content',
        'Low quality content...',
        { api_key: 'test-key' }
      );

      expect(result.recommendation).toBe('Discard');
    });

    it('should handle API errors gracefully', async () => {
      mockAxios.post.mockRejectedValue({
        response: {
          data: { error: { message: 'Invalid API key' } },
          statusText: 'Unauthorized'
        }
      });

      await expect(
        callOpenAI('test', 'content', { api_key: 'invalid-key' })
      ).rejects.toThrow('OpenAI API error: Invalid API key');
    });

    it('should handle network errors', async () => {
      mockAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(
        callOpenAI('test', 'content', { api_key: 'test-key' })
      ).rejects.toThrow('OpenAI request failed: Network error');
    });
  });

  describe('Anthropic Response Parsing', () => {
    it('should parse structured response correctly', async () => {
      const mockResponse = {
        data: {
          content: [{
            text: `SUMMARY: This document explains database optimization techniques.
RECOMMENDATION: Read
REASONING: Contains practical tips for improving database performance that would benefit developers.`
          }]
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await callAnthropic(
        'Analyze this content',
        'Database optimization guide...',
        { api_key: 'test-key', model: 'claude-3-haiku-20240307' }
      );

      expect(result).toEqual({
        recommendation: 'Read',
        summary: 'This document explains database optimization techniques.',
        reasoning: 'Contains practical tips for improving database performance that would benefit developers.'
      });
    });

    it('should handle Anthropic API errors', async () => {
      mockAxios.post.mockRejectedValue({
        response: {
          data: { error: { message: 'Rate limit exceeded' } },
          statusText: 'Too Many Requests'
        }
      });

      await expect(
        callAnthropic('test', 'content', { api_key: 'test-key' })
      ).rejects.toThrow('Anthropic API error: Rate limit exceeded');
    });
  });

  describe('LLM Provider Router', () => {
    it('should route to OpenAI provider', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: `SUMMARY: Test summary
RECOMMENDATION: Read
REASONING: Test reasoning`
            }
          }]
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await callLLM(
        'test prompt',
        'test content',
        {
          provider: 'openai',
          config: { api_key: 'test-key', model: 'gpt-4' }
        }
      );

      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4');
      expect(result.recommendation).toBe('Read');
    });

    it('should route to Anthropic provider', async () => {
      const mockResponse = {
        data: {
          content: [{
            text: `SUMMARY: Test summary
RECOMMENDATION: Discard
REASONING: Test reasoning`
          }]
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await callLLM(
        'test prompt',
        'test content',
        {
          provider: 'anthropic',
          config: { api_key: 'test-key', model: 'claude-3-sonnet-20240229' }
        }
      );

      expect(result.provider).toBe('anthropic');
      expect(result.model).toBe('claude-3-sonnet-20240229');
      expect(result.recommendation).toBe('Discard');
    });

    it('should throw error for unsupported provider', async () => {
      await expect(
        callLLM('test', 'content', {
          provider: 'unsupported',
          config: { api_key: 'test' }
        } as any)
      ).rejects.toThrow('Unsupported LLM provider: unsupported');
    });

    it('should use default models when not specified', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: { content: 'SUMMARY: Test\nRECOMMENDATION: Read\nREASONING: Test' }
          }]
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await callLLM(
        'test',
        'content',
        {
          provider: 'openai',
          config: { api_key: 'test-key' }
        }
      );

      expect(result.model).toBe('gpt-3.5-turbo');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response content', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: '' } }]
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await callOpenAI(
        'test',
        'content',
        { api_key: 'test-key' }
      );

      expect(result.recommendation).toBe('Read');
      expect(result.summary).toBe('Content analysis summary not available.');
      expect(result.reasoning).toBe('');
    });

    it('should handle malformed structured response', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: `SUMMARY:
RECOMMENDATION:
REASONING:`
            }
          }]
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await callOpenAI(
        'test',
        'content',
        { api_key: 'test-key' }
      );

      expect(result.recommendation).toBe('Read');
      // The parsing logic extracts the first sentence as fallback summary
      expect(result.summary).toContain('SUMMARY:');
    });

    it('should handle case-insensitive keywords', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: `summary: Case insensitive test
recommendation: DISCARD
reasoning: Testing case handling`
            }
          }]
        }
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await callOpenAI(
        'test',
        'content',
        { api_key: 'test-key' }
      );

      expect(result.recommendation).toBe('Discard');
      expect(result.summary).toBe('Case insensitive test');
    });
  });
});