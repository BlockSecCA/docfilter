# AI Triage Assistant

A desktop application for triaging and classifying documents, URLs, and multimedia using local or remote LLMs.

## Features

- **Multi-format Support**: PDF, DOCX, TXT, URLs, YouTube videos
- **AI Analysis**: OpenAI, Anthropic, and local LLM support
- **Local Storage**: All data stored locally (SQLite)
- **Drag & Drop**: Easy file ingestion
- **Configurable**: Customizable system prompts and providers

## Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Application**:
   ```bash
   npm run build
   ```

3. **Start Development**:
   ```bash
   npm run dev
   ```

## Configuration

Before using the app, configure your LLM providers:

1. Click the "Config" button in the top-right
2. Set your system prompt (instructions for the AI)
3. Configure at least one provider:
   - **OpenAI**: Add your API key
   - **Anthropic**: Add your API key  
   - **Local LLM**: Set endpoint (e.g., `http://localhost:11434/api/generate` for Ollama)

## Usage

1. **Add Content**: Drag files or paste URLs into the drop zone
2. **AI Analysis**: The app extracts content and gets AI recommendations
3. **Review Results**: Browse the inbox and click items for details
4. **Filter**: Use Read/Discard filters to organize results

## Supported Formats

- **Documents**: PDF, DOCX, TXT, Markdown
- **Web**: Any URL (extracts main content)
- **YouTube**: Video URLs (extracts title/description)

## Local LLM Setup

For Ollama:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama2

# Start server (usually runs on localhost:11434)
ollama serve
```

Then configure the endpoint as `http://localhost:11434/api/generate` in the app.

## Building for Production

```bash
npm run build
npm start
```

The app stores all data in your OS user data directory:
- **Windows**: `%APPDATA%/reading_agent/`
- **macOS**: `~/Library/Application Support/reading_agent/`
- **Linux**: `~/.local/share/reading_agent/`