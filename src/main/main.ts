import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { isDev } from './utils/env';
import { initDatabase } from './database/init';
import { registerIpcHandlers } from './ipc/handlers';
import { processArtifact, ArtifactInput } from './services/processor';
import { getDatabase } from './database/init';
import { v4 as uuidv4 } from 'uuid';

let mainWindow: BrowserWindow;

function debugLog(message: string, data?: any): void {
  console.log(message, data || '');
  // Send to renderer for DevTools visibility
  if (mainWindow && !mainWindow.isDestroyed()) {
    const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;
    mainWindow.webContents.send('debug-log', logMessage);
  }
}

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

## [1.7.1] - 2025-06-22

### Fixed
- Critical PDF browser integration bug causing stack overflow and performance degradation
- PDF extraction failing for arXiv URLs without .pdf extension (e.g., arxiv.org/pdf/1234567)
- False "token limit exceeded" errors for small PDFs processed via browser integration
- Raw PDF binary content being saved instead of extracted text for certain URL patterns
- Enhanced PDF URL detection to handle arXiv, query parameters, and fragment patterns
- Improved error handling with helpful troubleshooting guidance for PDF download failures

### Enhanced
- Added comprehensive debug logging visible in DevTools console for troubleshooting
- Enhanced PDF processing reliability across all scenarios (upload, drag-drop, browser integration)
- Added user warning in help documentation about PDF browser integration limitations
- Improved buffer content detection to identify PDFs regardless of filename extension

## [1.7.0] - 2025-06-21

### Added
- Browser integration with bookmarklet for sending URLs directly to DocFilter
- Custom protocol handler (docfilter://) for seamless browser-to-app communication
- Automatic PDF download and processing for PDF URLs from browser
- URL tracking parameter removal (utm_source, fbclid, etc.) for cleaner processing
- Single instance management to prevent multiple app windows
- Configurable token limits with visual truncation status indicators
- Enhanced error handling with content preservation during failures

### Enhanced
- Improved web content extraction with better main content detection
- Cross-platform protocol handler registration
- Event-based UI refresh system for real-time updates
- Enhanced database schema with was_truncated field for better content management

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
- Initial release of DocFilter
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
                    <li><strong>Set Token Limit</strong>: Configure max tokens based on your model:
                      <ul>
                        <li><strong>GPT-3.5</strong>: ~16,000 tokens</li>
                        <li><strong>GPT-4</strong>: ~128,000 tokens</li>
                        <li><strong>Claude</strong>: ~200,000 tokens</li>
                        <li><strong>Local LLMs</strong>: Varies by model</li>
                      </ul>
                    </li>
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
                  
                  <p><strong>Send URLs from Browser:</strong></p>
                  <ul>
                    <li>Add the DocFilter bookmarklet to your browser for quick URL sending</li>
                    <li>See the "Browser Integration" section below for setup instructions</li>
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
                  <p><strong>Zoom Controls:</strong> Use keyboard shortcuts (Ctrl/Cmd + Plus/Minus/0), mouse wheel (Ctrl/Cmd + scroll), or View menu to adjust text size (30%-300%).</p>
                  
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
                  
                  <h2>Browser Integration</h2>
                  
                  <h3>Setup Bookmarklet</h3>
                  
                  <p><strong>1. Add Bookmarklet to Browser:</strong></p>
                  <ul>
                    <li>Copy this JavaScript code:</li>
                  </ul>
                  <pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; overflow-x: auto;">javascript:(function(){window.open('docfilter://process?url=' + encodeURIComponent(window.location.href));})();</pre>
                  <ul>
                    <li>Create a new bookmark in your browser</li>
                    <li>Paste the code as the bookmark URL/location</li>
                    <li>Name it "Send to DocFilter" or similar</li>
                  </ul>
                  
                  <p><strong>2. Using the Bookmarklet:</strong></p>
                  <ul>
                    <li>Navigate to any webpage you want to analyze</li>
                    <li>Click the "Send to DocFilter" bookmark</li>
                    <li>Browser will prompt to open DocFilter (allow and optionally remember choice)</li>
                    <li>DocFilter will automatically process the page</li>
                  </ul>
                  
                  <h3>How It Works</h3>
                  <ul>
                    <li><strong>PDF URLs:</strong> Automatically downloads and processes PDF files (works great with arXiv papers)</li>
                    <li><strong>Web Pages:</strong> Extracts main content from regular websites</li>
                    <li><strong>URL Cleaning:</strong> Removes tracking parameters (utm_source, fbclid, etc.) automatically</li>
                    <li><strong>Single Window:</strong> Opens existing DocFilter window if already running</li>
                  </ul>
                  
                  <h3>Browser Compatibility</h3>
                  <ul>
                    <li><strong>Firefox:</strong> Full support, works with all page types</li>
                    <li><strong>Chrome/Edge:</strong> Full support, works with all page types</li>
                    <li><strong>Safari:</strong> Full support, works with all page types</li>
                  </ul>
                  
                  <h3>Limitations</h3>
                  <ul>
                    <li>Won't work on browser internal pages (chrome://, about:, etc.)</li>
                    <li>Local files (file://) are not supported - use drag and drop instead</li>
                    <li>Some PDF viewers may show the viewer URL instead of the actual PDF URL</li>
                    <li><strong>PDF processing may be unreliable:</strong> Large PDFs can cause timeouts and performance issues. Small PDFs may fail with incorrect "token limit" errors. For reliable PDF processing, download the file manually and drag-drop it into DocFilter instead.</li>
                  </ul>
                  
                  <h3>Troubleshooting</h3>
                  <p><strong>"No application found" error:</strong></p>
                  <ul>
                    <li>Make sure DocFilter is installed and has been run at least once</li>
                    <li>The protocol handler is registered automatically on first run</li>
                  </ul>
                  
                  <p><strong>Browser doesn't prompt:</strong></p>
                  <ul>
                    <li>Check if your browser blocked the popup</li>
                    <li>Try manually allowing popups for the current site</li>
                  </ul>
                  
                  <p><strong>Wrong URL being sent:</strong></p>
                  <ul>
                    <li>Some sites use complex URL structures - the bookmarklet sends the current page URL</li>
                    <li>For embedded PDFs, try right-clicking the PDF and copying its direct link instead</li>
                  </ul>

                  <h2>Understanding Token Management</h2>
                  
                  <p>DocFilter intelligently handles content that's too large for AI analysis:</p>
                  
                  <h3>How It Works</h3>
                  <ol>
                    <li><strong>Content Extraction</strong>: Always extracts full text from PDFs, documents, and web pages</li>
                    <li><strong>Token Estimation</strong>: Estimates content size using ~4 characters per token</li>
                    <li><strong>Smart Truncation</strong>: If content exceeds your token limit, it's truncated for AI analysis</li>
                    <li><strong>Full Preservation</strong>: Complete extracted content is always saved regardless of truncation</li>
                  </ol>
                  
                  <h3>Visual Status Indicators</h3>
                  <p>Look for these badges to understand what the AI analyzed:</p>
                  <ul>
                    <li><strong>No badge</strong>: AI analyzed the complete content</li>
                    <li><strong>✂️ Truncated</strong>: AI analyzed partial content (first ~80% of your token limit)</li>
                    <li><strong>❌ Error</strong>: AI analysis failed, but full content is preserved</li>
                  </ul>
                  
                  <h3>When Content Gets Truncated</h3>
                  <p><strong>Large arXiv Papers</strong>: Many research papers exceed token limits</p>
                  <ul>
                    <li>AI analyzes the beginning (introduction, abstract, methodology)</li>
                    <li>Full paper text is preserved for you to read manually</li>
                    <li>You can still get useful "Read" or "Discard" recommendations</li>
                  </ul>
                  
                  <p><strong>Massive Documents</strong>: Very long PDFs or web pages</p>
                  <ul>
                    <li>AI analyzes what fits within your token budget</li>
                    <li>Remaining content is available in the detail view</li>
                    <li>Consider increasing token limits for better coverage</li>
                  </ul>
                  
                  <h3>Optimizing Token Usage</h3>
                  <p><strong>Increase Token Limits</strong>:</p>
                  <ul>
                    <li>Go to Config → Token Limit</li>
                    <li>Set higher limits for more powerful models</li>
                    <li>GPT-4: up to ~128k tokens, Claude: up to ~200k tokens</li>
                  </ul>
                  
                  <p><strong>Reprocess with Higher Limits</strong>:</p>
                  <ul>
                    <li>Update your token limit in config</li>
                    <li>Click the 🔄 button on any artifact</li>
                    <li>AI will analyze more content with the new limit</li>
                    <li>Truncation badge may disappear if content now fits</li>
                  </ul>
                  
                  <p><strong>Model Recommendations</strong>:</p>
                  <ul>
                    <li><strong>GPT-3.5</strong>: Good for small to medium documents (~16k tokens)</li>
                    <li><strong>GPT-4</strong>: Excellent for large documents (~128k tokens)</li>
                    <li><strong>Claude</strong>: Best for very large content (~200k tokens)</li>
                  </ul>
                  
                  <h3>Why This System Works</h3>
                  <ul>
                    <li><strong>No Lost Content</strong>: Full text is always preserved, never lost</li>
                    <li><strong>Better Than Errors</strong>: Partial analysis is better than complete failure</li>
                    <li><strong>Upgrade Path</strong>: Easy to reprocess with better models later</li>
                    <li><strong>Clear Feedback</strong>: Visual indicators show exactly what happened</li>
                  </ul>

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
      zoomFactor: 1.0, // Default zoom level
    },
  });

  // Add keyboard shortcuts for zoom
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Debug logging removed - keeping for now to verify fix
    
    if (input.control || input.meta) { // Ctrl on Windows/Linux, Cmd on macOS
      // Handle zoom in: Ctrl + Plus, Ctrl + Equal, or Ctrl + Shift + Equal, or numpad plus
      if (input.key === 'Equal' || input.key === 'Plus' || 
          (input.key === '=' && !input.shift) || 
          (input.key === '+' && input.shift) ||
          input.code === 'NumpadAdd') { // Numpad plus key
        // Zoom in: Multiple key combinations for compatibility
        const currentZoom = mainWindow.webContents.getZoomFactor();
        const newZoom = Math.min(currentZoom + 0.1, 3.0); // Max zoom 300%
        mainWindow.webContents.setZoomFactor(newZoom);
        event.preventDefault();
      } else if (input.key === 'Minus' || input.key === '-' || input.code === 'NumpadSubtract') {
        // Zoom out: Ctrl/Cmd + Minus
        const currentZoom = mainWindow.webContents.getZoomFactor();
        const newZoom = Math.max(currentZoom - 0.1, 0.3); // Min zoom 30%
        mainWindow.webContents.setZoomFactor(newZoom);
        event.preventDefault();
      } else if (input.key === '0') {
        // Reset zoom: Ctrl/Cmd + 0
        mainWindow.webContents.setZoomFactor(1.0);
        event.preventDefault();
      }
    }
  });

  // Add mouse wheel zoom support
  mainWindow.webContents.on('zoom-changed', (event, zoomDirection) => {
    const currentZoom = mainWindow.webContents.getZoomFactor();
    if (zoomDirection === 'in') {
      const newZoom = Math.min(currentZoom + 0.1, 3.0);
      mainWindow.webContents.setZoomFactor(newZoom);
    } else {
      const newZoom = Math.max(currentZoom - 0.1, 0.3);
      mainWindow.webContents.setZoomFactor(newZoom);
    }
  });

  // Force production mode - always load built files
  mainWindow.loadFile(path.join(__dirname, '../../../renderer/index.html'));
}

// Browser integration functions
function cleanTrackingParams(url: string): string {
  try {
    const urlObj = new URL(url);
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'source',
      'campaign_id', 'ad_id', 'adset_id', 'msclkid', '_hsenc', '_hsmi'
    ];
    
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch (error) {
    console.error('Error cleaning URL parameters:', error);
    return url; // Return original if parsing fails
  }
}

function validateUrl(url: string): { valid: boolean; message?: string } {
  try {
    const urlObj = new URL(url);
    
    // Reject file:// URLs
    if (urlObj.protocol === 'file:') {
      return {
        valid: false,
        message: 'Local files not supported via browser. Please drag and drop the file directly into DocFilter.'
      };
    }
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        valid: false,
        message: 'Only HTTP and HTTPS URLs are supported.'
      };
    }
    
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      message: 'Invalid URL format.'
    };
  }
}

async function downloadPdf(url: string): Promise<Buffer | null> {
  try {
    debugLog('Attempting to download PDF from:', url);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      maxContentLength: 100 * 1024 * 1024, // 100MB limit
      maxBodyLength: 100 * 1024 * 1024, // 100MB limit
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // Check if response is actually a PDF
    const contentType = response.headers['content-type'];
    if (contentType && !contentType.includes('application/pdf')) {
      debugLog('Response is not a PDF, content-type:', contentType);
      return null;
    }
    
    const buffer = Buffer.from(response.data);
    debugLog('PDF download successful, size:', response.data.byteLength);
    debugLog('Buffer created, size:', buffer.length);
    debugLog('PDF header check:', buffer.toString('ascii', 0, 8));
    return buffer;
  } catch (error: any) {
    debugLog('PDF download failed:', error.message);
    return null;
  }
}

async function processUrlFromBrowser(url: string): Promise<void> {
  try {
    debugLog('=== BROWSER INTEGRATION DEBUG START ===');
    debugLog('Processing URL from browser:', url);
    
    // Validate URL
    const validation = validateUrl(url);
    if (!validation.valid) {
      console.error('URL validation failed:', validation.message);
      return;
    }
    
    // Clean tracking parameters
    const cleanUrl = cleanTrackingParams(url);
    debugLog('Cleaned URL:', cleanUrl);
    
    let artifactInput: ArtifactInput;
    
    // Check if it's a PDF URL (by extension or known PDF patterns)
    const isPdfUrl = cleanUrl.toLowerCase().endsWith('.pdf') || 
                     cleanUrl.includes('arxiv.org/pdf/') ||
                     cleanUrl.includes('.pdf?') ||
                     cleanUrl.includes('.pdf#');
    
    if (isPdfUrl) {
      debugLog('Detected PDF URL, attempting download...');
      const pdfBuffer = await downloadPdf(cleanUrl);
      
      if (pdfBuffer) {
        debugLog('PDF download successful, buffer size:', pdfBuffer.length);
        debugLog('Downloaded PDF buffer first 20 bytes:', Array.from(pdfBuffer.subarray(0, 20)));
        artifactInput = {
          type: 'file',
          source: cleanUrl,
          content: pdfBuffer
        };
        debugLog('Created artifactInput for PDF:', {
          type: artifactInput.type,
          source: artifactInput.source,
          contentIsBuffer: artifactInput.content instanceof Buffer,
          contentSize: pdfBuffer.length,
          bufferHeader: pdfBuffer.toString('ascii', 0, 10)
        });
      } else {
        console.log('PDF download failed, cannot process as web content');
        // Don't fall back to web scraping for PDF URLs - this causes stack overflow
        // Instead, create an error artifact to inform the user
        const result = {
          extractedContent: `PDF download failed for ${cleanUrl}. This may be due to:\n\n1. The PDF requires authentication or login\n2. The server is blocking automated downloads\n3. The PDF link is invalid or expired\n\nPlease try:\n- Downloading the PDF manually and drag-dropping it into DocFilter\n- Checking if the PDF URL is accessible in your browser\n- Using the direct PDF link if this is an embedded viewer`,
          recommendation: 'Error',
          summary: 'PDF download failed',
          reasoning: 'PDF download failed - manual download may be required',
          provider: 'none',
          model: 'none',
          wasTruncated: false
        };
        
        // Save error result directly and return early
        const db = getDatabase();
        const artifactId = uuidv4();
        
        await new Promise<void>((resolve, reject) => {
          db.run(
            `INSERT INTO artifacts (id, type, source, extracted_content, ai_recommendation, ai_summary, ai_reasoning, provider, model, was_truncated, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))`,
            [
              artifactId,
              'url', // Keep as 'url' type for consistency
              cleanUrl,
              result.extractedContent,
              result.recommendation,
              result.summary,
              result.reasoning,
              result.provider,
              result.model,
              result.wasTruncated ? 1 : 0
            ],
            function(err) {
              if (err) {
                console.error('Database insert error:', err);
                reject(err);
              } else {
                console.log(`Artifact added from browser integration: ${artifactId}`);
                resolve();
              }
            }
          );
        });
        
        // Notify renderer to refresh
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('artifact-added');
        }
        
        return; // Exit early to avoid further processing
      }
    } else {
      console.log('Processing as web URL...');
      artifactInput = {
        type: 'url',
        source: cleanUrl,
        content: ''
      };
    }
    
    // Process through the full pipeline (extraction + AI analysis)
    console.log('Starting full artifact processing...');
    console.log('Artifact input:', {
      type: artifactInput.type,
      source: artifactInput.source,
      contentType: typeof artifactInput.content,
      contentSize: artifactInput.content instanceof Buffer ? artifactInput.content.length : 
                   typeof artifactInput.content === 'string' ? artifactInput.content.length : 'unknown'
    });
    
    let result;
    try {
      debugLog('Starting artifact processing...');
      result = await processArtifact(artifactInput);
      debugLog('Processing complete:', result.recommendation);
      debugLog('Result extracted content length:', result.extractedContent.length);
      debugLog('Result extracted content preview:', result.extractedContent.substring(0, 200) + '...');
      debugLog('Result reasoning preview:', result.reasoning.substring(0, 200) + '...');
      debugLog('Was truncated:', result.wasTruncated);
      debugLog('=== BROWSER INTEGRATION DEBUG END ===');
    } catch (processingError: any) {
      console.error('processArtifact threw an error:', processingError.message);
      console.error('Full error:', processingError);
      // Create a fallback result to save the error info
      result = {
        extractedContent: `Processing error: ${processingError.message}`,
        recommendation: 'Error',
        summary: 'Processing failed',
        reasoning: `Processing failed with error: ${processingError.message}`,
        provider: 'none',
        model: 'none',
        wasTruncated: false
      };
    }
    
    // Save to database using the existing pattern
    const db = getDatabase();
    const artifactId = uuidv4();
    
    await new Promise<void>((resolve, reject) => {
      db.run(
        `INSERT INTO artifacts (id, type, source, extracted_content, ai_recommendation, ai_summary, ai_reasoning, provider, model, was_truncated, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))`,
        [
          artifactId,
          artifactInput.type,
          artifactInput.source,
          result.extractedContent,
          result.recommendation,
          result.summary,
          result.reasoning,
          result.provider,
          result.model,
          result.wasTruncated ? 1 : 0
        ],
        function (err) {
          if (err) {
            console.error('Database save error:', err);
            reject(err);
          } else {
            console.log('Artifact saved to database with ID:', artifactId);
            resolve();
          }
        }
      );
    });
    
    // Focus the main window to show the user the result
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      // Trigger a refresh of the inbox to show the new item
      mainWindow.webContents.send('artifact-added', artifactId);
    }
    
  } catch (error: any) {
    console.error('Error processing URL from browser:', error);
    // TODO: Show error notification to user
  }
}

function handleProtocolUrl(protocolUrl: string): void {
  try {
    console.log('=== PROTOCOL HANDLER START ===');
    console.log('Received protocol URL:', protocolUrl);
    
    // Parse the protocol URL: docfilter://process?url=...
    const url = new URL(protocolUrl);
    console.log('Parsed URL hostname:', url.hostname);
    
    if (url.hostname !== 'process') {
      console.error('Unknown protocol command:', url.hostname);
      return;
    }
    
    const targetUrl = url.searchParams.get('url');
    console.log('Raw target URL from params:', targetUrl);
    
    if (!targetUrl) {
      console.error('No URL parameter found in protocol URL');
      return;
    }
    
    const decodedUrl = decodeURIComponent(targetUrl);
    console.log('Decoded target URL:', decodedUrl);
    
    // Process the URL
    console.log('About to call processUrlFromBrowser...');
    processUrlFromBrowser(decodedUrl).catch(error => {
      console.error('processUrlFromBrowser failed:', error);
    });
    console.log('=== PROTOCOL HANDLER END ===');
    
  } catch (error: any) {
    console.error('Error in handleProtocolUrl:', error);
  }
}

// Handle single instance and protocol registration
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this one
  app.quit();
} else {
  // Register protocol handler for docfilter://
  app.setAsDefaultProtocolClient('docfilter');
  
  // Handle second instance (when protocol is invoked while app is running)
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    
    // Check for protocol URL in command line arguments
    const protocolUrl = commandLine.find(arg => arg.startsWith('docfilter://'));
    if (protocolUrl) {
      handleProtocolUrl(protocolUrl);
    }
  });
  
  // Handle protocol URL on macOS
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleProtocolUrl(url);
  });
  
  app.whenReady().then(async () => {
    await initDatabase();
    registerIpcHandlers();
    createMenu();
    createWindow();
    
    // Handle protocol URL passed as command line argument on Windows/Linux
    const protocolUrl = process.argv.find(arg => arg.startsWith('docfilter://'));
    if (protocolUrl) {
      handleProtocolUrl(protocolUrl);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});