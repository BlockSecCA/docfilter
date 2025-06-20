import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import { isDev } from './utils/env';
import { initDatabase } from './database/init';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow;

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
                    <li>Click the <strong>Config</strong> button (⚙️) in the top-right corner</li>
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
                  </ul>
                  
                  <h3>4. Manage Your Content</h3>
                  <p><strong>Filter Items:</strong> Click <strong>All</strong>, <strong>Read</strong>, or <strong>Discard</strong> buttons to filter your inbox</p>
                  <p><strong>Sort Items:</strong> Use the dropdown to sort by <strong>Newest First</strong> or <strong>Oldest First</strong></p>
                  <p><strong>Delete Items:</strong> Hover over any item and click the <strong>×</strong> button to remove it</p>
                  <p><strong>Reprocess Items:</strong> Click the <strong>🔄</strong> button to analyze an item again (useful after changing your system prompt or AI provider)</p>
                  
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
            const aboutWindow = new BrowserWindow({
              width: 400,
              height: 300,
              modal: true,
              parent: mainWindow,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
              }
            });
            
            aboutWindow.loadURL(`data:text/html,
              <html>
                <head><title>About</title></head>
                <body style="font-family: system-ui; padding: 40px; text-align: center;">
                  <h2>AI Triage Assistant</h2>
                  <p>Desktop application for triaging documents, URLs, and multimedia using AI analysis.</p>
                  <p>Version 1.0.0</p>
                  <p style="margin-top: 30px; font-size: 12px; color: #666;">
                    Built with Electron, React, and TypeScript
                  </p>
                </body>
              </html>
            `);
            
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