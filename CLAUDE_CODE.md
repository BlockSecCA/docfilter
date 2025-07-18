# Claude Code - DocFilter Project Guide

**Quick Reference for Claude Code sessions to understand this project rapidly**

## 🎯 Project Overview

**DocFilter** - Electron desktop app that analyzes documents, URLs, and multimedia using AI to recommend "Read" or "Discard" with summaries and reasoning.

- **Tech Stack**: Electron + React + TypeScript + SQLite + Vite
- **Current Version**: 1.6.0 (as of 2025-06-21)
- **Purpose**: Document triage and classification using local/remote LLMs

📋 **For complete technical specifications, see [SPECIFICATION.md](SPECIFICATION.md)**

## 📁 Key Files to Read First

### **Essential Architecture Files**
```
src/main/main.ts              # Electron main process entry point
src/main/database/init.ts     # SQLite database schema and initialization
src/main/ipc/handlers.ts      # IPC communication between main and renderer
src/main/services/processor.ts # Core content processing logic
```

### **LLM Integration**
```
src/main/services/llm/index.ts    # LLM provider interface and router
src/main/services/llm/openai.ts   # OpenAI API integration
src/main/services/llm/anthropic.ts # Anthropic API integration
src/main/services/llm/local.ts    # Local LLM (Ollama) integration
```

### **Content Extraction**
```
src/main/services/extractors/index.ts # Content extractor router
src/main/services/extractors/pdf.ts   # PDF content extraction
src/main/services/extractors/docx.ts  # DOCX content extraction
src/main/services/extractors/web.ts   # Web scraping and YouTube
```

### **UI Components**
```
src/renderer/src/App.tsx                    # Main React app component
src/renderer/src/components/DetailPane.tsx  # Artifact detail view (shows summary/reasoning)
src/renderer/src/components/Inbox.tsx       # Artifact list view
src/renderer/src/components/DropZone.tsx    # File drop and URL input
src/renderer/src/components/ConfigModal.tsx # AI provider configuration
```

### **Documentation**
```
README.md         # User-facing documentation
HELP.md           # Built-in help content
CHANGELOG.md      # Version history
SPECIFICATION.md  # Complete technical specifications
package.json      # Dependencies and scripts
```

## 🔄 Core Workflow

1. **Content Input** → DropZone accepts files/URLs
2. **Content Extraction** → Extractors process different formats  
3. **AI Analysis** → LLM providers generate summary + recommendation + reasoning
4. **Storage** → SQLite stores results
5. **Display** → DetailPane shows summary above reasoning

*For detailed database schema and TypeScript interfaces, see [SPECIFICATION.md](SPECIFICATION.md)*

## 🚀 Development Commands

```bash
# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Run built app
npm start
# OR
npx electron dist/main/src/main/main.js

# Testing
npm test              # Run unit tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Package for distribution
npm run dist        # All platforms
npm run dist:win    # Windows only
npm run pack        # Portable (no installer)

# Sync WSL to Windows (custom script)
./push.sh
```

## 🎨 UI Architecture Patterns

### **Data Flow**
1. **IPC Communication**: Renderer ↔ Main process via `window.electronAPI`
2. **State Management**: React useState, no external state library
3. **Styling**: CSS files co-located with components
4. **Responsive Layout**: Split panes with resizable panels

### **Component Hierarchy**
```
App.tsx
├── Header.tsx (title + config button)
├── DropZone.tsx (file/URL input)
├── Inbox.tsx (artifact list with filters)
├── DetailPane.tsx (summary + reasoning + content)
└── ConfigModal.tsx (AI provider settings)
```

*For version history and recent changes, see [CHANGELOG.md](CHANGELOG.md)*

## 🛠️ Common Development Tasks

### **Adding New Content Extractors**
1. Create new file in `src/main/services/extractors/`
2. Implement extractor function
3. Export from `src/main/services/extractors/index.ts`

### **Adding New LLM Providers**
1. Create new file in `src/main/services/llm/`
2. Implement provider with LLMResult interface
3. Add to switch statement in `src/main/services/llm/index.ts`

### **Database Changes**
1. Modify schema in `src/main/database/init.ts`
2. Add migration logic with error handling
3. Update TypeScript interfaces
4. Update IPC handlers for new fields

### **UI Component Changes**
1. Modify React components in `src/renderer/src/components/`
2. Update CSS files for styling
3. Ensure TypeScript interfaces match

### **Adding Tests**
1. Create test files in `tests/` directory 
2. Follow existing patterns: `*.test.ts` for unit tests
3. Run `npm test` to verify all 58 existing tests still pass
4. Use Jest with mocking for external dependencies

## 📍 Important Conventions

### **Error Handling**
- LLM failures return error artifacts with 'Error' recommendation
- Database operations use Promise wrappers
- UI shows graceful fallbacks for missing data

### **File Naming**
- TypeScript: `.ts` for logic, `.tsx` for React components
- Co-located CSS files with same name as component
- Interfaces defined in same files or dedicated `.d.ts`

### **Git Workflow**
- Feature branches: `feature/description-v1.x.x`
- Commit format: `feat:`, `fix:`, `docs:`
- PR includes comprehensive description and test plan

## 🐛 Common Issues & Solutions

### **Database Migration**
- Always include error handling for existing columns
- Test migration on existing databases
- Use `ALTER TABLE ... ADD COLUMN` with IF NOT EXISTS logic

### **Cross-Platform Development**
- WSL to Windows: Use `./push.sh` script
- Path differences: Use `path.join()` for file paths
- Permissions: Exclude `.git` folder when copying

### **LLM Integration**
- Handle API rate limits and errors gracefully
- Parse structured responses with fallbacks
- Different APIs have different response formats

## 🔍 Debugging Tips

### **Database Issues**
```bash
# Find database location (varies by environment)
find ~ -name "triage.db" 2>/dev/null

# Check schema
sqlite3 path/to/triage.db ".schema artifacts"

# View data
sqlite3 path/to/triage.db "SELECT * FROM artifacts LIMIT 5;"
```

### **Console Logging**
- Main process logs appear in terminal
- Renderer logs appear in DevTools (F12)
- Database path logged on startup in v1.5.0+

### **Build Issues**
- Clear `dist/` folder if builds behave strangely
- Check TypeScript errors in both main and renderer
- Ensure all dependencies installed with `npm install`

## 📝 Next Session Checklist

When starting a new Claude Code session:

1. **Read this file first** 📖
2. **Check current branch**: `git branch`
3. **Review recent commits**: `git log --oneline -5`
4. **Check for changes**: `git status`
5. **Review package.json version** for current state
6. **Scan README.md** for any updates
7. **Read any TODOs** or issues mentioned by user

This guide should get you up to speed quickly on the DocFilter codebase! 🚀