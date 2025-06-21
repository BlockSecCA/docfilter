# DocFilter - User Guide

## What is DocFilter?

DocFilter helps you quickly decide which documents, web pages, and videos are worth your time by using artificial intelligence to analyze and recommend "Read" or "Discard" for each item.

## Getting Started

### 1. Configure the AI
Before using the app, you need to set up an AI provider:

1. Click the **Config** button (⚙️) in the top-right corner
2. Write instructions for the AI in the **System Prompt** box (e.g., "You are helping me decide what content is worth reading. Focus on business and technology topics.")
3. **Set Token Limit**: Configure max tokens based on your model:
   - **GPT-3.5**: ~16,000 tokens
   - **GPT-4**: ~128,000 tokens
   - **Claude**: ~200,000 tokens
   - **Local LLMs**: Varies by model
4. Choose and configure at least one AI provider:
   - **OpenAI**: Enter your API key (recommended: use GPT-4o model)
   - **Anthropic**: Enter your API key (use Claude-3-Haiku or newer)
   - **Local LLM**: Enter your local server address (e.g., Ollama)

### 2. Add Content to Analyze

**Add Files:**
- Drag and drop PDF, Word documents, or text files into the drop zone
- Or click the drop zone to browse and select files

**Add Web Pages:**
- Enter any website URL in the URL field and press Enter
- The app will extract the main content from the page

**Add YouTube Videos:**
- Enter a YouTube URL to analyze the video's title and description

**Send URLs from Browser:**
- Add the DocFilter bookmarklet to your browser for quick URL sending
- See the "Browser Integration" section below for setup instructions

### 3. Review AI Recommendations

After processing, each item appears in your **Inbox** with:
- **Green "READ" badge**: AI recommends this content is valuable
- **Red "DISCARD" badge**: AI suggests skipping this content
- **Yellow "PENDING" badge**: Still being processed

Click any item to see:
- AI-generated summary (quick overview of the content)
- AI's detailed reasoning for the recommendation
- Full extracted content
- When it was processed
- Which AI model was used

### 4. Manage Your Content

**Filter Items:**
- Click **All**, **Read**, or **Discard** buttons to filter your inbox

**Sort Items:**
- Use the dropdown to sort by **Newest First** or **Oldest First**

**Delete Items:**
- Hover over any item and click the **×** button to remove it

**Reprocess Items:**
- Click the **🔄** button to analyze an item again (useful after changing your system prompt or AI provider)

## Tips for Better Results

**Write Clear Instructions:**
Your system prompt should clearly describe what you're looking for. Examples:
- "Focus on cybersecurity and data privacy topics"
- "Recommend articles about artificial intelligence and machine learning"
- "I'm interested in business strategy and market analysis"

**Choose the Right AI Model:**
- **GPT-4o**: Best for long documents and complex analysis
- **Claude-3-Haiku**: Fast and efficient for most content
- **Local LLMs**: Private but may be less accurate

**File Size Limits:**
- Very large documents (50+ pages) may need GPT-4o or Claude-3-Opus
- If you get errors, try a more powerful model

## Understanding the Interface

**Left Panel:**
- Drop zone for adding new content
- Inbox showing all processed items with recommendations

**Right Panel:**
- Detailed view of selected items
- Shows extracted content and AI analysis

**Resizable Panels:**
- Drag the vertical divider between panels to adjust their size
- Your preferred size is automatically saved

**Zoom Controls:**
- **Keyboard shortcuts**: Ctrl/Cmd + Plus to zoom in, Ctrl/Cmd + Minus to zoom out, Ctrl/Cmd + 0 to reset zoom
- **Mouse wheel**: Hold Ctrl/Cmd and scroll to zoom in/out
- **Menu**: Use View menu → Zoom In/Zoom Out/Reset Zoom
- **Zoom range**: 30% to 300% for optimal readability

## Data Privacy

- All your content and AI recommendations are stored locally on your computer
- Nothing is shared or uploaded except when sending content to your chosen AI provider
- You can delete items individually or clear your database anytime

## Troubleshooting

**"Context length exceeded" errors:**
- Try using GPT-4o instead of GPT-3.5-turbo for large documents

**Files won't process:**
- Supported formats: PDF, Word (.docx), text files, markdown
- Try uploading one file at a time

**AI not responding:**
- Check your API keys in the Config menu
- Verify your internet connection
- For local LLMs, ensure your server is running

**App won't start:**
- Make sure you've run "npm run build" after any changes
- On Linux/WSL2, additional graphics libraries may be needed

## Browser Integration

### Setup Bookmarklet

1. **Add Bookmarklet to Browser:**
   - Copy this JavaScript code:
   ```javascript
   javascript:(function(){window.open('docfilter://process?url=' + encodeURIComponent(window.location.href));})();
   ```
   - Create a new bookmark in your browser
   - Paste the code as the bookmark URL/location
   - Name it "Send to DocFilter" or similar

2. **Using the Bookmarklet:**
   - Navigate to any webpage you want to analyze
   - Click the "Send to DocFilter" bookmark
   - Browser will prompt to open DocFilter (allow and optionally remember choice)
   - DocFilter will automatically process the page

### How It Works

- **PDF URLs**: Automatically downloads and processes PDF files (works great with arXiv papers)
- **Web Pages**: Extracts main content from regular websites
- **URL Cleaning**: Removes tracking parameters (utm_source, fbclid, etc.) automatically
- **Single Window**: Opens existing DocFilter window if already running

### Browser Compatibility

- **Firefox**: Full support, works with all page types
- **Chrome/Edge**: Full support, works with all page types
- **Safari**: Full support, works with all page types

### Limitations

- Won't work on browser internal pages (chrome://, about:, etc.)
- Local files (file://) are not supported - use drag and drop instead
- Some PDF viewers may show the viewer URL instead of the actual PDF URL

### Troubleshooting

**"No application found" error:**
- Make sure DocFilter is installed and has been run at least once
- The protocol handler is registered automatically on first run

**Browser doesn't prompt:**
- Check if your browser blocked the popup
- Try manually allowing popups for the current site

**Wrong URL being sent:**
- Some sites use complex URL structures - the bookmarklet sends the current page URL
- For embedded PDFs, try right-clicking the PDF and copying its direct link instead

## Understanding Token Management

DocFilter intelligently handles content that's too large for AI analysis:

### How It Works

1. **Content Extraction**: Always extracts full text from PDFs, documents, and web pages
2. **Token Estimation**: Estimates content size using ~4 characters per token
3. **Smart Truncation**: If content exceeds your token limit, it's truncated for AI analysis
4. **Full Preservation**: Complete extracted content is always saved regardless of truncation

### Visual Status Indicators

Look for these badges to understand what the AI analyzed:

- **No badge**: AI analyzed the complete content
- **✂️ Truncated**: AI analyzed partial content (first ~80% of your token limit)
- **❌ Error**: AI analysis failed, but full content is preserved

### When Content Gets Truncated

**Large arXiv Papers**: Many research papers exceed token limits
- AI analyzes the beginning (introduction, abstract, methodology)
- Full paper text is preserved for you to read manually
- You can still get useful "Read" or "Discard" recommendations

**Massive Documents**: Very long PDFs or web pages
- AI analyzes what fits within your token budget
- Remaining content is available in the detail view
- Consider increasing token limits for better coverage

### Optimizing Token Usage

**Increase Token Limits**: 
- Go to Config → Token Limit
- Set higher limits for more powerful models
- GPT-4: up to ~128k tokens, Claude: up to ~200k tokens

**Reprocess with Higher Limits**:
- Update your token limit in config
- Click the 🔄 button on any artifact
- AI will analyze more content with the new limit
- Truncation badge may disappear if content now fits

**Model Recommendations**:
- **GPT-3.5**: Good for small to medium documents (~16k tokens)
- **GPT-4**: Excellent for large documents (~128k tokens)
- **Claude**: Best for very large content (~200k tokens)

### Why This System Works

- **No Lost Content**: Full text is always preserved, never lost
- **Better Than Errors**: Partial analysis is better than complete failure
- **Upgrade Path**: Easy to reprocess with better models later
- **Clear Feedback**: Visual indicators show exactly what happened

---

Need more technical help? Check the README.md file in the project folder for developer documentation.