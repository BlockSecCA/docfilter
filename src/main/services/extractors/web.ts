import axios from 'axios';
import * as cheerio from 'cheerio';

export async function extractWebContent(url: string): Promise<string> {
  try {
    // Try simple HTTP request first
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style, nav, footer, aside, .ad, .advertisement, .sidebar').remove();
    
    // Try to find main content
    let content = '';
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-body',
      '#content',
      '.main-content'
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0 && element.text().trim().length > 100) {
        content = element.text().trim();
        break;
      }
    }

    // Fallback to body if no main content found
    if (!content) {
      content = $('body').text().trim();
    }

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').trim();
    
    return content;
  } catch (error: any) {
    throw new Error(`Failed to extract web content: ${error.message}`);
  }
}

export async function extractYouTubeTranscript(url: string): Promise<string> {
  try {
    // For YouTube, we'll try to extract video ID and get basic info
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    
    if (!videoIdMatch) {
      throw new Error('Invalid YouTube URL');
    }

    const videoId = videoIdMatch[1];
    
    // Simple approach: get the page and extract title/description
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const title = $('meta[property="og:title"]').attr('content') || 'Unknown Title';
    const description = $('meta[property="og:description"]').attr('content') || '';

    return `YouTube Video: ${title}\n\nDescription: ${description}`;
  } catch (error: any) {
    throw new Error(`Failed to extract YouTube content: ${error.message}`);
  }
}