# DocFilter: Document Triage Application Specification

## Purpose

DocFilter is a desktop application that analyzes documents, URLs, and multimedia using AI to recommend "Read" or "Discard" with detailed summaries and reasoning. All processing and data storage is local to the user's machine with no cloud backends required.

---

## Architecture

DocFilter implements a **three-tier architecture** within the Electron framework:

```
┌─────────────────┐    IPC     ┌─────────────────┐    SQL     ┌─────────────────┐
│ Presentation    │ ◄────────► │ Application     │ ◄────────► │ Data Tier       │
│ Tier            │            │ Tier            │            │                 │
│ - React UI      │            │ - Business      │            │ - SQLite DB     │
│ - User Input    │            │   Logic         │            │ - Config        │
│ - Display       │            │ - AI APIs       │            │ - Artifacts     │
│                 │            │ - File Extract  │            │                 │
└─────────────────┘            └─────────────────┘            └─────────────────┘
    Renderer Process              Main Process                   Persistent Storage
```

---

## Core Features

### 1. Content Ingestion

**File Support:**
- **Drag & Drop Interface**: PDF, DOCX, TXT, Markdown files
- **URL Processing**: Web pages with content extraction
- **YouTube Integration**: Video title and description analysis
- **File Browser**: Click to select files alternatively

**Input Methods:**
- Drag and drop files into designated drop zone
- Paste URLs for web content analysis
- Browse and select files via system dialog

### 2. Content Extraction

**PDF Processing:**
- Uses `pdf-parse` library for text extraction
- Handles both text-based and scanned PDFs
- Error handling for corrupted or protected files

**DOCX Processing:**
- Uses `mammoth` library for Word document extraction
- Extracts raw text while preserving structure
- Handles complex document formats

**Web Content:**
- Uses `axios` + `cheerio` for web scraping
- Intelligent content detection (articles, main content)
- Removes navigation, ads, and sidebar content
- User-Agent spoofing for compatibility

**YouTube Integration:**
- Extracts video metadata (title, description)
- Processes YouTube URLs automatically
- No transcript extraction (focuses on discoverable content)

### 3. AI Analysis

**Multi-Provider Support:**
- **OpenAI**: GPT-3.5-turbo, GPT-4, GPT-4o models
- **Anthropic**: Claude-3-Haiku, Claude-3-Sonnet, Claude-3-Opus
- **Local LLMs**: Ollama and compatible HTTP API servers

**Analysis Output:**
- **Recommendation**: "Read" or "Discard" classification
- **Summary**: 1-2 sentence content overview (v1.5.0+)
- **Reasoning**: Detailed explanation for the recommendation
- **Metadata**: Provider, model, and timestamp information

**System Prompts:**
- User-configurable instructions for AI decision-making
- Persistent storage in local database
- Applied consistently across all content types

### 4. User Interface

**Inbox Management:**
- **Filtering**: All items, Read only, Discard only
- **Sorting**: Newest first, Oldest first
- **Visual Indicators**: Color-coded badges for recommendations
- **Quick Actions**: Delete items, reprocess with different settings

**Detail View:**
- **Summary Section**: AI-generated content overview
- **Reasoning Section**: Detailed AI explanation
- **Content Preview**: Full extracted text (scrollable)
- **Metadata Display**: Processing details and timestamps
- **Action Buttons**: Reprocess, delete, open original (for URLs)

**Panel Layout:**
- **Resizable Panels**: Adjustable split between inbox and detail view
- **Persistent Preferences**: Panel sizes saved automatically
- **Responsive Design**: Adapts to different window sizes

### 5. Accessibility & Usability

**Zoom Controls (v1.6.0):**
- **Keyboard Shortcuts**: Ctrl/Cmd + Plus/Minus/0, including numpad
- **Mouse Wheel**: Ctrl/Cmd + scroll wheel for zoom
- **Menu Integration**: View menu with zoom options
- **Zoom Persistence**: Remembers zoom level between sessions
- **Range Limits**: 30% minimum, 300% maximum for optimal readability

**User Experience:**
- **Menu System**: Streamlined View and Help menus
- **Built-in Help**: Comprehensive user guide accessible via Help menu
- **About Dialog**: Version information and changelog display
- **Error Handling**: Graceful fallbacks and user-friendly error messages

### 6. Configuration Management

**Provider Configuration:**
- **API Key Management**: Secure storage of authentication credentials
- **Model Selection**: Choose specific models for each provider
- **Default Provider**: Set preferred AI service
- **Local LLM Setup**: Configure custom endpoint URLs

**Application Settings:**
- **System Prompt Editing**: Customize AI instructions
- **Default Configurations**: Sensible defaults for new users
- **Settings Persistence**: All preferences stored in local database

### 7. Data Management

**Local Storage:**
- **SQLite Database**: All data stored locally in user's AppData folder
- **No Cloud Sync**: Complete privacy with local-only storage
- **Database Migration**: Automatic schema updates for new versions

**Content Processing:**
- **Reprocessing**: Re-analyze existing items with different settings
- **Content Extraction Bypass**: Reuse extracted content to avoid re-parsing
- **Batch Operations**: Delete and reprocess multiple items

---

## Technical Implementation

### Technology Stack

**Frontend:**
- **React 19**: Modern UI framework with hooks
- **TypeScript**: Type-safe development
- **CSS Modules**: Component-scoped styling

**Backend:**
- **Electron 36**: Desktop application framework
- **Node.js**: Runtime for backend services
- **SQLite3**: Local database storage

**Key Libraries:**
- `pdf-parse`: PDF content extraction
- `mammoth`: DOCX document processing
- `cheerio`: HTML parsing and web scraping
- `axios`: HTTP client for web requests
- `uuid`: Unique identifier generation

### Database Schema

**Artifacts Table:**
```sql
CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,                    -- 'file', 'url', 'youtube'
  source TEXT NOT NULL,                  -- Original file path or URL
  extracted_content TEXT,               -- Processed content
  ai_recommendation TEXT,               -- 'Read' or 'Discard'
  ai_summary TEXT,                      -- Content summary (v1.5.0+)
  ai_reasoning TEXT,                    -- AI's detailed reasoning
  provider TEXT,                        -- 'openai', 'anthropic', 'local'
  model TEXT,                          -- Model name used
  was_truncated INTEGER DEFAULT 0,      -- 1 if content was truncated for AI analysis (v1.7.0+)
  created_at DATETIME,
  updated_at DATETIME
);
```

**Configuration Table:**
```sql
CREATE TABLE config (
  key TEXT PRIMARY KEY,                 -- 'system_prompt', 'default_provider', 'providers', 'max_tokens'
  value TEXT NOT NULL,                  -- JSON for providers config
  updated_at DATETIME
);
```

### Development & Testing

**Build System:**
- **TypeScript Compilation**: Separate configs for main and renderer
- **Vite**: Fast development server and build tool
- **Electron Builder**: Application packaging and distribution

**Testing Framework:**
- **Jest**: Unit testing framework with TypeScript support
- **Comprehensive Coverage**: LLM parsing, content extraction, database operations
- **Mock Dependencies**: External services and native modules
- **58 Test Cases**: Full coverage of core functionality

### Quality Assurance

**Error Handling:**
- **Graceful Degradation**: Fallbacks for API failures
- **User-Friendly Messages**: Clear error reporting
- **Logging**: Development-mode debugging without user exposure

**Performance:**
- **Efficient Content Processing**: Streaming and chunked processing
- **Database Optimization**: Indexed queries and prepared statements
- **Memory Management**: Proper cleanup and resource management

---

## User Workflows

### Primary Use Case: Document Analysis

1. **Content Input**: User drags PDF/DOCX file or pastes URL
2. **Content Extraction**: App extracts text content from source
3. **AI Analysis**: Configured LLM analyzes content and provides recommendation
4. **Result Storage**: Analysis results stored in local database
5. **User Review**: User sees summary, recommendation, and detailed reasoning

### Configuration Workflow

1. **Initial Setup**: User configures at least one AI provider
2. **System Prompt**: User customizes AI instructions for their needs
3. **Provider Selection**: User chooses default provider and model
4. **Testing**: User processes sample content to verify setup

### Management Workflow

1. **Inbox Review**: User filters and sorts processed items
2. **Detail Analysis**: User clicks items to review full analysis
3. **Reprocessing**: User reprocesses items with updated settings
4. **Cleanup**: User deletes unwanted items to maintain organization

---

## Security & Privacy

### Data Protection

**Local-Only Storage:**
- All content and analysis stored on user's machine
- No cloud synchronization or external data transmission
- User controls all data retention and deletion

**API Security:**
- API keys stored securely in local database
- No key transmission except to configured providers
- User-controlled provider selection and usage

### Privacy Features

**Content Handling:**
- Content only sent to user-selected AI providers
- No telemetry or usage analytics
- No automatic updates without user consent

---

## Platform Support

### Operating Systems

**Primary Platforms:**
- **Windows 10/11**: Full feature support with native zoom controls
- **macOS**: Complete functionality with platform-specific menu adaptations
- **Linux**: Full compatibility with desktop environments

### Distribution

**Packaging:**
- **Windows**: NSIS installer with desktop/start menu shortcuts
- **Portable Mode**: Directory-based distribution option
- **Auto-Updates**: Optional, user-controlled update mechanism

---

## Version History & Roadmap

### Current Version: 1.7.0

**Major Features Implemented:**
- ✅ Multi-provider AI analysis (OpenAI, Anthropic, Local) 
- ✅ Browser integration with bookmarklet and protocol handler
- ✅ Configurable token limits with smart content truncation
- ✅ Visual truncation status indicators
- ✅ Content summaries with detailed reasoning
- ✅ Comprehensive zoom controls for accessibility
- ✅ Enhanced error handling with content preservation
- ✅ Event-based UI refresh system
- ✅ URL cleaning and PDF auto-download
- ✅ Single instance management
- ✅ Resizable interface panels
- ✅ Built-in help and documentation system
- ✅ Unit testing framework with 58 test cases
- ✅ Database migration system
- ✅ Cross-platform compatibility

### Architecture Decisions

**Design Principles:**
- **Privacy First**: All processing and storage remains local
- **Modularity**: Pluggable content extractors and AI providers
- **User Control**: Configurable settings with sensible defaults
- **Accessibility**: Zoom controls and clear visual design
- **Reliability**: Comprehensive error handling and testing

**Technical Choices:**
- **Electron**: Chosen for cross-platform desktop capability
- **React**: Selected for modern, maintainable UI development
- **SQLite**: Local database for simplicity and reliability
- **TypeScript**: Type safety for complex application logic

---

## Success Criteria

### Functional Requirements

✅ **Content Processing**: Successfully extract and analyze PDF, DOCX, and web content
✅ **AI Integration**: Support multiple AI providers with consistent interface
✅ **Local Storage**: All data stored locally with no external dependencies
✅ **User Interface**: Intuitive inbox and detail view with accessibility features
✅ **Configuration**: User-friendly provider and prompt management

### Quality Requirements

✅ **Reliability**: Comprehensive error handling and graceful degradation
✅ **Performance**: Responsive UI with efficient content processing
✅ **Accessibility**: Zoom controls and clear visual indicators
✅ **Maintainability**: Well-tested codebase with modular architecture
✅ **Documentation**: Complete user and developer documentation

### User Experience Requirements

✅ **Ease of Use**: Drag-and-drop interface with immediate feedback
✅ **Flexibility**: Configurable AI providers and analysis instructions
✅ **Privacy**: Complete local operation with user data control
✅ **Consistency**: Uniform behavior across all content types and platforms

---

## Future Development

See [ROADMAP.md](ROADMAP.md) for detailed planned enhancements including:

- **Near-term**: Dark theme, keyboard shortcuts, advanced filtering, full-text search
- **Medium-term**: Additional file formats, OCR integration, browser extensions, multi-provider analysis  
- **Long-term**: Plugin architecture, workflow automation, research-focused features

### Architectural Evolution

The current three-tier architecture provides a solid foundation for future enhancements while maintaining the core principles of privacy, modularity, and user control that define DocFilter's approach to document triage and analysis.