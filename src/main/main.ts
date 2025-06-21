import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { isDev } from './utils/env';
import { initDatabase } from './database/init';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow;

function getAppVersion(): string {
  // app.getVersion() returns Electron version, not app version
  // Use direct package.json reading to get actual app version
  try {
    const packagePath = path.join(process.resourcesPath || __dirname, '../../../package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    return packageJson.version;
  } catch (error) {
    // Fallback for development - try relative path
    try {
      const devPackagePath = path.join(__dirname, '../../../../package.json');
      const packageContent = fs.readFileSync(devPackagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      return packageJson.version;
    } catch (devError) {
      return '1.3'; // Ultimate fallback
    }
  }
}

function getChangelog(): string {
  // For compiled apps, embed changelog directly instead of reading from file
  // This ensures it's always available regardless of packaging
  const changelogContent = `# Changelog

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
- Dynamic version display reading from package.json
- Complete changelog with release notes in About dialog
- Internal read-only help system replacing external file dependency
- Custom menu system with streamlined View and Help menus  
- User Guide modal window with professional formatting

### Changed
- About dialog now shows current version and full release history
- Help documentation accurately reflects app behavior (READ/DISCARD only)
- Removed File, Edit, and Window menus to reduce clutter
- Help content is now self-contained and cannot be accidentally edited

### Fixed
- Version display now updates automatically with package.json
- Help menu path resolution issues resolved
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
- About dialog and basic help system`;

  // Convert markdown to basic HTML for display
  const htmlContent = changelogContent
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|l|p])/gm, '<p>')
    .replace(/(?<!>)$/gm, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-6])/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p>(<li)/g, '<ul>$1')
    .replace(/(<\/li>)<\/p>/g, '$1</ul>');
  
  return htmlContent;
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'User Guide',
          click: () => {
            // Create internal help window with embedded content
            const helpWindow = new BrowserWindow({
              width: 800,
              height: 700,
              modal: true,
              parent: mainWindow,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
              },
              autoHideMenuBar: true
            });
            
            const helpContent = `
              <!DOCTYPE html>
              <html>
                <head>
                  <title>AI Triage Assistant - User Guide</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                      line-height: 1.6;
                      max-width: 800px;
                      margin: 0 auto;
                      padding: 20px;
                      color: #333;
                      background: white;
                    }
                    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                    h2 { color: #34495e; margin-top: 30px; }
                    h3 { color: #555; }
                    code, strong { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
                    ul, ol { padding-left: 20px; }
                    li { margin: 5px 0; }
                    .badge { 
                      padding: 2px 6px; 
                      border-radius: 3px; 
                      font-size: 0.9em; 
                      font-weight: bold;
                    }
                    .badge.read { background: #d4edda; color: #155724; }
                    .badge.discard { background: #f8d7da; color: #721c24; }
                    hr { border: none; border-top: 1px solid #e0e0e0; margin: 30px 0; }
                  </style>
                </head>
                <body>
                  <h1>AI Triage Assistant - User Guide</h1>
                  
                  <h2>What is AI Triage Assistant?</h2>
                  <p>AI Triage Assistant helps you quickly decide which documents, web pages, and videos are worth your time by using artificial intelligence to analyze and recommend "Read" or "Discard" for each item.</p>
                  
                  <h2>Getting Started</h2>
                  
                  <h3>1. Configure the AI</h3>
                  <p>Before using the app, you need to set up an AI provider:</p>
                  <ol>
                    <li>Click the <strong>Config</strong> button in the top-right corner</li>
                    <li>Write instructions for the AI in the <strong>System Prompt</strong> box (e.g., "You are helping me decide what content is worth reading. Focus on business and technology topics.")</li>
                    <li>Choose and configure at least one AI provider:
                      <ul>
                        <li><strong>OpenAI</strong>: Enter your API key (recommended: use GPT-4o model)</li>
                        <li><strong>Anthropic</strong>: Enter your API key (use Claude-3-Haiku or newer)</li>
                        <li><strong>Local LLM</strong>: Enter your local server address (e.g., Ollama)</li>
                      </ul>
                    </li>
                  </ol>
                  
                  <h3>2. Add Content to Analyze</h3>
                  <p><strong>Add Files:</strong></p>
                  <ul>
                    <li>Drag and drop PDF, Word documents, or text files into the drop zone</li>
                    <li>Or click the drop zone to browse and select files</li>
                  </ul>
                  
                  <p><strong>Add Web Pages:</strong></p>
                  <ul>
                    <li>Enter any website URL in the URL field and press Enter</li>
                    <li>The app will extract the main content from the page</li>
                  </ul>
                  
                  <p><strong>Add YouTube Videos:</strong></p>
                  <ul>
                    <li>Enter a YouTube URL to analyze the video's title and description</li>
                  </ul>
                  
                  <h3>3. Review AI Recommendations</h3>
                  <p>After processing, each item appears in your <strong>Inbox</strong> with:</p>
                  <ul>
                    <li><span class="badge read">READ</span> badge: AI recommends this content is valuable</li>
                    <li><span class="badge discard">DISCARD</span> badge: AI suggests skipping this content</li>
                  </ul>
                  
                  <p>Click any item to see:</p>
                  <ul>
                    <li>Full extracted content</li>
                    <li>AI's reasoning for the recommendation</li>
                    <li>When it was processed</li>
                    <li>Which AI model was used</li>
                    <li><strong>Open Original</strong> button (for URLs) to view the source webpage</li>
                  </ul>
                  
                  <h3>4. Manage Your Content</h3>
                  <p><strong>Filter Items:</strong> Click <strong>All</strong>, <strong>Read</strong>, or <strong>Discard</strong> buttons to filter your inbox</p>
                  <p><strong>Sort Items:</strong> Use the dropdown to sort by <strong>Newest First</strong> or <strong>Oldest First</strong></p>
                  <p><strong>Delete Items:</strong> Hover over any item and click the <strong>&times;</strong> button to remove it</p>
                  <p><strong>Reprocess Items:</strong> Click the <strong>Reprocess</strong> button to analyze an item again (useful after changing your system prompt or AI provider)</p>
                  
                  <h2>Tips for Better Results</h2>
                  <p><strong>Write Clear Instructions:</strong> Your system prompt should clearly describe what you're looking for. Examples:</p>
                  <ul>
                    <li>"Focus on cybersecurity and data privacy topics"</li>
                    <li>"Recommend articles about artificial intelligence and machine learning"</li>
                    <li>"I'm interested in business strategy and market analysis"</li>
                  </ul>
                  
                  <p><strong>Choose the Right AI Model:</strong></p>
                  <ul>
                    <li><strong>GPT-4o</strong>: Best for long documents and complex analysis</li>
                    <li><strong>Claude-3-Haiku</strong>: Fast and efficient for most content</li>
                    <li><strong>Local LLMs</strong>: Private but may be less accurate</li>
                  </ul>
                  
                  <p><strong>File Size Limits:</strong> Very large documents (50+ pages) may need GPT-4o or Claude-3-Opus. If you get errors, try a more powerful model.</p>
                  
                  <h2>Understanding the Interface</h2>
                  <p><strong>Left Panel:</strong> Drop zone for adding new content + Inbox showing all processed items with recommendations</p>
                  <p><strong>Right Panel:</strong> Detailed view of selected items + Shows extracted content and AI analysis</p>
                  <p><strong>Resizable Panels:</strong> Drag the vertical divider between panels to adjust their size. Your preferred size is automatically saved.</p>
                  
                  <h2>Data Privacy</h2>
                  <ul>
                    <li>All your content and AI recommendations are stored locally on your computer</li>
                    <li>Nothing is shared or uploaded except when sending content to your chosen AI provider</li>
                    <li>You can delete items individually or clear your database anytime</li>
                  </ul>
                  
                  <h2>Troubleshooting</h2>
                  <p><strong>"Context length exceeded" errors:</strong> Try using GPT-4o instead of GPT-3.5-turbo for large documents</p>
                  <p><strong>Files won't process:</strong> Supported formats: PDF, Word (.docx), text files, markdown. Try uploading one file at a time.</p>
                  <p><strong>AI not responding:</strong> Check your API keys in the Config menu, verify your internet connection, and for local LLMs, ensure your server is running</p>
                  <p><strong>App won't start:</strong> Make sure you've run "npm run build" after any changes. On Linux/WSL2, additional graphics libraries may be needed.</p>
                  
                  <hr>
                  <p><em>Need more technical help? Check the README.md file in the project folder for developer documentation.</em></p>
                </body>
              </html>
            `;
            
            helpWindow.loadURL(`data:text/html,${encodeURIComponent(helpContent)}`);
            helpWindow.setMenuBarVisibility(false);
          }
        },
        { type: 'separator' },
        {
          label: 'About AI Triage Assistant',
          click: () => {
            const version = getAppVersion();
            const changelog = getChangelog();
            
            const aboutWindow = new BrowserWindow({
              width: 700,
              height: 600,
              modal: true,
              parent: mainWindow,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
              },
              autoHideMenuBar: true
            });
            
            const aboutContent = `
              <!DOCTYPE html>
              <html>
                <head>
                  <title>About AI Triage Assistant</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                      line-height: 1.6;
                      max-width: 700px;
                      margin: 0 auto;
                      padding: 20px;
                      color: #333;
                      background: white;
                    }
                    .header {
                      text-align: center;
                      border-bottom: 2px solid #3498db;
                      padding-bottom: 20px;
                      margin-bottom: 30px;
                    }
                    .header h1 { 
                      color: #2c3e50; 
                      margin-bottom: 10px; 
                    }
                    .version {
                      font-size: 1.2em;
                      font-weight: bold;
                      color: #3498db;
                      margin: 10px 0;
                    }
                    .description {
                      color: #666;
                      font-style: italic;
                      margin-bottom: 10px;
                    }
                    .tech-stack {
                      font-size: 0.9em;
                      color: #888;
                    }
                    .changelog {
                      margin-top: 30px;
                      max-height: 350px;
                      overflow-y: auto;
                      border: 1px solid #e0e0e0;
                      border-radius: 5px;
                      padding: 15px;
                      background: #f9f9f9;
                    }
                    .changelog h1 { 
                      color: #2c3e50; 
                      font-size: 1.3em;
                      margin-bottom: 20px;
                      border-bottom: 1px solid #3498db;
                      padding-bottom: 5px;
                    }
                    .changelog h2 { 
                      color: #34495e; 
                      font-size: 1.1em;
                      margin-top: 25px;
                      margin-bottom: 10px;
                    }
                    .changelog h3 { 
                      color: #555; 
                      font-size: 1em;
                      margin-top: 15px;
                      margin-bottom: 5px;
                    }
                    .changelog ul { 
                      margin: 5px 0 15px 20px; 
                      padding: 0;
                    }
                    .changelog li { 
                      margin: 3px 0; 
                      list-style-type: disc;
                    }
                    .changelog p {
                      margin: 10px 0;
                    }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <h1>AI Triage Assistant</h1>
                    <div class="version">Version ${version}</div>
                    <div class="description">
                      Desktop application for triaging documents, URLs, and multimedia using AI analysis.
                    </div>
                    <div class="tech-stack">
                      Built with Electron, React, and TypeScript
                    </div>
                  </div>
                  
                  <div class="changelog">
                    ${changelog}
                  </div>
                </body>
              </html>
            `;
            
            aboutWindow.loadURL(`data:text/html,${encodeURIComponent(aboutContent)}`);
            aboutWindow.setMenuBarVisibility(false);
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Force production mode - always load built files
  mainWindow.loadFile(path.join(__dirname, '../../../renderer/index.html'));
}

app.whenReady().then(async () => {
  await initDatabase();
  registerIpcHandlers();
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});