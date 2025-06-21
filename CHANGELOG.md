# Changelog

All notable changes to the AI Triage Assistant will be documented in this file.

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