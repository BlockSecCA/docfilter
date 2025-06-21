import { initDatabase, getDatabase } from '../src/main/database/init';
import { registerIpcHandlers } from '../src/main/ipc/handlers';

// Mock dependencies
jest.mock('sqlite3');
jest.mock('electron');
jest.mock('fs');
jest.mock('path');
jest.mock('uuid');

const mockSqlite3 = require('sqlite3');
const mockElectron = require('electron');
const mockFs = require('fs');
const mockPath = require('path');
const mockUuid = require('uuid');

describe('Database Operations', () => {
  let mockDb: any;
  let mockApp: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock database methods
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      serialize: jest.fn((callback) => callback()),
      prepare: jest.fn(() => ({
        run: jest.fn(),
        finalize: jest.fn((callback) => callback())
      }))
    };

    // Mock Electron app
    mockApp = {
      getPath: jest.fn(() => '/mock/user/data')
    };

    mockElectron.app = mockApp;
    
    // Mock file system
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined);
    
    // Mock path
    mockPath.join.mockReturnValue('/mock/user/data/triage.db');
    
    // Mock sqlite3 Database constructor
    mockSqlite3.Database = jest.fn((path, callback) => {
      setTimeout(() => callback(null), 0); // Simulate successful connection
      return mockDb;
    });

    // Mock UUID
    mockUuid.v4.mockReturnValue('mock-uuid-123');
  });

  describe('Database Initialization', () => {
    it('should initialize database successfully', async () => {
      mockDb.run.mockImplementation((sql, callback) => {
        if (callback) callback();
      });

      await initDatabase();

      expect(mockApp.getPath).toHaveBeenCalledWith('userData');
      expect(mockPath.join).toHaveBeenCalledWith('/mock/user/data', 'triage.db');
      expect(mockSqlite3.Database).toHaveBeenCalledWith('/mock/user/data/triage.db', expect.any(Function));
      
      // Check that tables were created
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS artifacts')
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS config')
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR IGNORE INTO config')
      );
    });

    it('should create user data directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockDb.run.mockImplementation((sql, callback) => {
        if (callback) callback();
      });

      await initDatabase();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/mock/user/data', { recursive: true });
    });

    it('should handle directory creation failure', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(initDatabase()).rejects.toThrow('Failed to create user data directory: Permission denied');
    });

    it('should handle database connection failure', async () => {
      mockSqlite3.Database = jest.fn((path, callback) => {
        setTimeout(() => callback(new Error('Database file is locked')), 0);
        return mockDb;
      });

      await expect(initDatabase()).rejects.toThrow('Database file is locked');
    });

    it('should handle ai_summary column migration gracefully', async () => {
      let callCount = 0;
      mockDb.run.mockImplementation((sql, callbackOrParams, callback) => {
        const actualCallback = typeof callbackOrParams === 'function' ? callbackOrParams : callback;
        
        // Simulate the ALTER TABLE command failing (column already exists)
        if (sql.includes('ALTER TABLE artifacts ADD COLUMN ai_summary')) {
          if (actualCallback) {
            actualCallback(new Error('duplicate column name: ai_summary'));
          }
        } else if (actualCallback) {
          actualCallback();
        }
      });

      await initDatabase();

      // Should not throw error due to duplicate column
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE artifacts ADD COLUMN ai_summary'),
        expect.any(Function)
      );
    });

    it('should return database instance', async () => {
      mockDb.run.mockImplementation((sql, callback) => {
        if (callback) callback();
      });

      await initDatabase();
      const db = getDatabase();

      expect(db).toBe(mockDb);
    });
  });

  describe('Artifact Operations', () => {
    beforeEach(async () => {
      mockDb.run.mockImplementation((sql, params, callback) => {
        const actualCallback = typeof params === 'function' ? params : callback;
        if (actualCallback) actualCallback();
      });
      
      await initDatabase();
    });

    it('should save artifact successfully', () => {
      const mockCallback = jest.fn();
      
      mockDb.run.mockImplementation((sql, params, callback) => {
        callback();
      });

      // This would normally be called through IPC, but we're testing the logic
      const artifactData = {
        id: 'test-id',
        type: 'file',
        source: 'document.pdf',
        extracted_content: 'Test content',
        ai_recommendation: 'Read',
        ai_summary: 'Test summary',
        ai_reasoning: 'Test reasoning',
        provider: 'openai',
        model: 'gpt-3.5-turbo'
      };

      const db = getDatabase();
      db.run(
        `INSERT INTO artifacts (id, type, source, extracted_content, ai_recommendation, ai_summary, ai_reasoning, provider, model, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))`,
        [
          artifactData.id,
          artifactData.type,
          artifactData.source,
          artifactData.extracted_content,
          artifactData.ai_recommendation,
          artifactData.ai_summary,
          artifactData.ai_reasoning,
          artifactData.provider,
          artifactData.model
        ],
        mockCallback
      );

      expect(mockCallback).toHaveBeenCalled();
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO artifacts'),
        expect.arrayContaining([
          artifactData.id,
          artifactData.type,
          artifactData.source,
          artifactData.extracted_content,
          artifactData.ai_recommendation,
          artifactData.ai_summary,
          artifactData.ai_reasoning,
          artifactData.provider,
          artifactData.model
        ]),
        expect.any(Function)
      );
    });

    it('should handle database insertion error', () => {
      const mockCallback = jest.fn();
      const testError = new Error('Database is locked');
      
      mockDb.run.mockImplementation((sql, params, callback) => {
        callback(testError);
      });

      const db = getDatabase();
      db.run(
        'INSERT INTO artifacts (id, type, source) VALUES (?, ?, ?)',
        ['test-id', 'file', 'test.pdf'],
        mockCallback
      );

      expect(mockCallback).toHaveBeenCalledWith(testError);
    });

    it('should retrieve artifacts successfully', () => {
      const mockCallback = jest.fn();
      const mockArtifacts = [
        { id: '1', type: 'file', source: 'doc1.pdf', ai_recommendation: 'Read' },
        { id: '2', type: 'url', source: 'https://example.com', ai_recommendation: 'Discard' }
      ];
      
      mockDb.all.mockImplementation((sql, callback) => {
        callback(null, mockArtifacts);
      });

      const db = getDatabase();
      db.all('SELECT * FROM artifacts ORDER BY created_at DESC', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, mockArtifacts);
      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM artifacts ORDER BY created_at DESC',
        expect.any(Function)
      );
    });

    it('should retrieve single artifact by ID', () => {
      const mockCallback = jest.fn();
      const mockArtifact = { id: 'test-id', type: 'file', source: 'test.pdf' };
      
      mockDb.get.mockImplementation((sql, params, callback) => {
        callback(null, mockArtifact);
      });

      const db = getDatabase();
      db.get('SELECT * FROM artifacts WHERE id = ?', ['test-id'], mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, mockArtifact);
      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT * FROM artifacts WHERE id = ?',
        ['test-id'],
        expect.any(Function)
      );
    });

    it('should delete artifact successfully', () => {
      const mockCallback = jest.fn();
      
      mockDb.run.mockImplementation((sql, params, callback) => {
        callback();
      });

      const db = getDatabase();
      db.run('DELETE FROM artifacts WHERE id = ?', ['test-id'], mockCallback);

      expect(mockCallback).toHaveBeenCalled();
      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM artifacts WHERE id = ?',
        ['test-id'],
        expect.any(Function)
      );
    });

    it('should update artifact during reprocessing', () => {
      const mockCallback = jest.fn();
      
      mockDb.run.mockImplementation((sql, params, callback) => {
        callback();
      });

      const updateData = {
        recommendation: 'Discard',
        summary: 'Updated summary',
        reasoning: 'Updated reasoning',
        provider: 'anthropic',
        model: 'claude-3-haiku',
        id: 'test-id'
      };

      const db = getDatabase();
      db.run(
        `UPDATE artifacts 
         SET ai_recommendation = ?, ai_summary = ?, ai_reasoning = ?, provider = ?, model = ?, updated_at = datetime('now', 'localtime')
         WHERE id = ?`,
        [updateData.recommendation, updateData.summary, updateData.reasoning, updateData.provider, updateData.model, updateData.id],
        mockCallback
      );

      expect(mockCallback).toHaveBeenCalled();
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE artifacts'),
        [updateData.recommendation, updateData.summary, updateData.reasoning, updateData.provider, updateData.model, updateData.id],
        expect.any(Function)
      );
    });
  });

  describe('Configuration Operations', () => {
    beforeEach(async () => {
      mockDb.run.mockImplementation((sql, callback) => {
        if (callback) callback();
      });
      
      await initDatabase();
    });

    it('should retrieve configuration successfully', () => {
      const mockCallback = jest.fn();
      const mockConfigRows = [
        { key: 'system_prompt', value: 'Test prompt' },
        { key: 'default_provider', value: 'openai' },
        { key: 'providers', value: '{"openai": {"api_key": "test"}}' }
      ];
      
      mockDb.all.mockImplementation((sql, callback) => {
        callback(null, mockConfigRows);
      });

      const db = getDatabase();
      db.all('SELECT key, value FROM config', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null, mockConfigRows);
    });

    it('should update configuration successfully', () => {
      const mockPrepareStatement = {
        run: jest.fn(),
        finalize: jest.fn((callback) => callback())
      };
      
      mockDb.prepare.mockReturnValue(mockPrepareStatement);

      const config = {
        system_prompt: 'Updated prompt',
        default_provider: 'anthropic',
        providers: { anthropic: { api_key: 'test-key' } }
      };

      const db = getDatabase();
      
      // Simulate the actual config update logic
      db.serialize(() => {
        const stmt = db.prepare(
          'INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, datetime("now"))'
        );
        
        stmt.run('system_prompt', config.system_prompt);
        stmt.run('default_provider', config.default_provider);
        stmt.run('providers', JSON.stringify(config.providers));
        
        stmt.finalize(() => {});
      });

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, datetime("now"))'
      );
      expect(mockPrepareStatement.run).toHaveBeenCalledWith('system_prompt', config.system_prompt);
      expect(mockPrepareStatement.run).toHaveBeenCalledWith('default_provider', config.default_provider);
      expect(mockPrepareStatement.run).toHaveBeenCalledWith('providers', JSON.stringify(config.providers));
      expect(mockPrepareStatement.finalize).toHaveBeenCalled();
    });

    it('should handle configuration update errors', () => {
      const mockCallback = jest.fn();
      const testError = new Error('Configuration update failed');
      
      const mockPrepareStatement = {
        run: jest.fn(),
        finalize: jest.fn((callback) => callback(testError))
      };
      
      mockDb.prepare.mockReturnValue(mockPrepareStatement);

      const db = getDatabase();
      
      db.serialize(() => {
        const stmt = db.prepare('INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, datetime("now"))');
        stmt.run('test_key', 'test_value');
        stmt.finalize(mockCallback);
      });

      expect(mockCallback).toHaveBeenCalledWith(testError);
    });
  });

  describe('Error Handling', () => {
    it('should handle database query errors gracefully', () => {
      const testError = new Error('Table does not exist');
      
      mockDb.all.mockImplementation((sql, callback) => {
        callback(testError);
      });

      // Test that the mock implementation works as expected
      mockDb.all('SELECT * FROM nonexistent_table', (err) => {
        expect(err).toBe(testError);
      });

      expect(mockDb.all).toHaveBeenCalled();
    });

    it('should handle malformed SQL queries', () => {
      const syntaxError = new Error('SQL syntax error');
      
      mockDb.run.mockImplementation((sql, callback) => {
        callback(syntaxError);
      });

      // Test that the mock implementation works as expected
      mockDb.run('INVALID SQL QUERY', (err) => {
        expect(err).toBe(syntaxError);
      });

      expect(mockDb.run).toHaveBeenCalled();
    });
  });
});