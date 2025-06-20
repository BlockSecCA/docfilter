# AI Triage Assistant - User Guide

## What is AI Triage Assistant?

AI Triage Assistant helps you quickly decide which documents, web pages, and videos are worth your time by using artificial intelligence to analyze and recommend "Read" or "Discard" for each item.

## Getting Started

### 1. Configure the AI
Before using the app, you need to set up an AI provider:

1. Click the **Config** button (⚙️) in the top-right corner
2. Write instructions for the AI in the **System Prompt** box (e.g., "You are helping me decide what content is worth reading. Focus on business and technology topics.")
3. Choose and configure at least one AI provider:
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

### 3. Review AI Recommendations

After processing, each item appears in your **Inbox** with:
- **Green "READ" badge**: AI recommends this content is valuable
- **Red "DISCARD" badge**: AI suggests skipping this content
- **Yellow "PENDING" badge**: Still being processed

Click any item to see:
- Full extracted content
- AI's reasoning for the recommendation
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

---

Need more technical help? Check the README.md file in the project folder for developer documentation.