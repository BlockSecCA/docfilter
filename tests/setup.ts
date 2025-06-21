// Global test setup
// Mock console methods to avoid cluttering test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock Electron APIs that might be imported
const electronMock = {
  app: {
    getPath: jest.fn(() => '/tmp/test'),
    getName: jest.fn(() => 'DocFilter'),
    getVersion: jest.fn(() => '1.5.1')
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  },
  BrowserWindow: jest.fn()
};

// Mock problematic modules
jest.mock('electron', () => electronMock, { virtual: true });

// Mock sqlite3 to avoid native module issues
jest.mock('sqlite3', () => ({
  Database: jest.fn()
}), { virtual: true });

// Mock pdf-parse to avoid file system dependencies
jest.mock('pdf-parse', () => jest.fn(), { virtual: true });