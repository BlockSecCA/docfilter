# Changelog

All notable changes to DocFilter will be documented in this file.

## [1.7.0] - 2025-06-21

### Added
- **Browser Integration**: Custom protocol handler (`docfilter://`) for seamless URL processing
- **Bookmarklet**: One-click URL sending from any browser to DocFilter
- **Automatic PDF Processing**: Direct download and analysis of PDF URLs (perfect for arXiv papers)
- **Configurable Token Limits**: User-defined max token setting for different AI models
- **Smart Content Truncation**: Preserves full content while fitting AI analysis within token limits
- **Truncation Status Indicators**: Visual badges showing when content was truncated vs analyzed fully
- **Enhanced Error Handling**: Always preserves extracted content even when AI analysis fails
- **URL Cleaning**: Automatic removal of tracking parameters (utm_source, fbclid, etc.)
- **Single Instance Management**: Protocol URLs route to existing window instead of opening new instances
- **Event-Based UI Refresh**: Real-time updates when processing completes

### Enhanced
- **Model Flexibility**: Configure token limits based on your AI model (GPT-3.5: ~16k, GPT-4: ~128k, Claude: ~200k)
- **Large Document Handling**: Large arXiv PDFs now get partial AI analysis while preserving full text
- **Reprocessing Intelligence**: Reprocess with higher token limits to analyze more content
- **Visual Feedback**: Clear indicators in inbox and detail views for truncation status
- **Browser Compatibility**: Full support across Firefox, Chrome, Edge, and Safari
- **Cross-Platform Support**: Protocol handler registration on Windows, macOS, and Linux
- **Comprehensive Documentation**: Updated help system with browser setup and token management guides

### Technical Improvements
- **Token Estimation**: Smart character-to-token conversion for content sizing
- **Graceful Degradation**: Failed AI analysis preserves extracted content for manual review
- **Database Schema**: Added truncation tracking with automatic migration
- **Better Error Messages**: Specific guidance for token limit vs other API failures

## [1.6.0] - 2025-06-21

### Added
- Font size zoom controls with keyboard shortcuts (Ctrl/Cmd + Plus/Minus/0)
- Mouse wheel zoom support (Ctrl/Cmd + scroll wheel)
- Zoom menu items in View menu (Zoom In, Zoom Out, Reset Zoom)
- Zoom level limits: 30% minimum, 300% maximum for optimal usability
- Cross-platform zoom support (Windows, macOS, Linux)

### Enhanced
- Improved accessibility with adjustable text size for better readability
- Enhanced user experience with familiar zoom controls from other applications

## [1.5.1] - 2025-06-21

### Fixed
- Reprocess functionality bypasses content extraction to prevent "Invalid PDF/DOCX structure" errors
- Artifact reprocessing now uses stored extracted content directly instead of re-parsing files
- Improved reprocessing performance by eliminating unnecessary file I/O operations
- Universal fix for all content types (PDF, DOCX, URLs, YouTube videos)

## [1.5.0] - 2025-06-21

### Added
- Content summary section displayed above reasoning in artifact details
- AI-generated summaries provide quick 1-2 sentence overview of analyzed content
- Summary appears for new artifacts and when reprocessing existing items
- Enhanced LLM prompts request structured responses with summary, recommendation, and reasoning
- Database migration automatically adds summary support to existing installations

### Enhanced
- All LLM providers (OpenAI, Anthropic, Local/Ollama) now generate content summaries
- Improved artifact detail view with better information hierarchy
- Consistent styling between summary and reasoning sections

## [1.4.1] - 2025-06-20

### Fixed
- First-run database initialization issue preventing config saving on fresh installations
- User data directory creation before SQLite database initialization
- Improved first-run user experience with reliable settings persistence

## [1.4] - 2025-06-20

### Fixed
- Reprocess button now immediately refreshes UI after reprocessing artifacts
- Users can see updated AI recommendations and reasoning without manual refresh
- Improved user experience for artifact reprocessing workflow

## [1.3] - 2025-06-20

### Added
- Internal read-only help system replacing external file dependency
- Custom menu system with streamlined View and Help menus  
- User Guide modal window with professional formatting and styling

### Changed
- Help documentation now accurately reflects app behavior (READ/DISCARD only)
- Removed File, Edit, and Window menus to reduce clutter
- Help content is now self-contained and cannot be accidentally edited

### Fixed
- Help menu path resolution issues
- Incorrect PENDING state documentation removed

## [1.2] - 2025-06-20

### Added
- Resizable inbox and detail panels with drag handle
- Panel width preferences saved to localStorage
- Smooth resize interactions with visual feedback

### Changed
- Improved UI layout with adjustable panel sizing
- Enhanced user experience with persistent panel preferences

## [1.1] - 2025-06-20

### Added
- Time-based sorting for inbox items (Newest/Oldest first)
- Sort controls in inbox header
- Improved artifact management workflow

### Changed
- Enhanced inbox functionality with better organization options

## [1.0] - 2025-06-20

### Added
- Initial release of AI Triage Assistant
- Multi-format content support (PDF, DOCX, TXT, URLs, YouTube)
- AI analysis with OpenAI, Anthropic, and local LLM providers
- Local SQLite storage for all data
- Drag & drop file interface
- Configurable system prompts and AI providers
- Inbox with filtering (All/Read/Discard)
- Detailed artifact view with AI reasoning
- About dialog and basic help system