import Database from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

let db: Database.Database;

export async function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'triage.db');
    
    console.log('Database will be created at:', dbPath);
    
    // Ensure user data directory exists before creating database
    try {
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
    } catch (error: any) {
      reject(new Error(`Failed to create user data directory: ${error.message}`));
      return;
    }
    
    db = new Database.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }

      // Create tables
      db.serialize(() => {
        // Artifacts table
        db.run(`
          CREATE TABLE IF NOT EXISTS artifacts (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            source TEXT NOT NULL,
            extracted_content TEXT,
            ai_recommendation TEXT,
            ai_summary TEXT,
            ai_reasoning TEXT,
            provider TEXT,
            model TEXT,
            created_at DATETIME DEFAULT (datetime('now', 'localtime')),
            updated_at DATETIME DEFAULT (datetime('now', 'localtime'))
          )
        `);

        // Add ai_summary column to existing artifacts table if it doesn't exist
        db.run(`
          ALTER TABLE artifacts ADD COLUMN ai_summary TEXT
        `, (err) => {
          // Ignore error if column already exists
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding ai_summary column:', err);
          }
        });

        // Configuration table
        db.run(`
          CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT (datetime('now', 'localtime'))
          )
        `);

        // Insert default configuration
        db.run(`
          INSERT OR IGNORE INTO config (key, value) VALUES 
          ('system_prompt', 'Analyze this content and provide a recommendation: "Read" if the content is valuable, informative, or relevant to the user''s interests, or "Discard" if it''s spam, low-quality, or irrelevant. Provide a brief reasoning for your decision.'),
          ('default_provider', 'openai'),
          ('providers', '{}')
        `);

        resolve();
      });
    });
  });
}

export function getDatabase(): Database.Database {
  return db;
}