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
          click: async () => {
            // Open HELP.md file with system default application
            const helpPath = path.join(__dirname, '../../../../HELP.md');
            shell.openPath(helpPath);
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