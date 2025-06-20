import Database from 'sqlite3';
import * as path from 'path';
import { app } from 'electron';
let db;
export async function initDatabase() {
    return new Promise((resolve, reject) => {
        const dbPath = path.join(app.getPath('userData'), 'triage.db');
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
            ai_reasoning TEXT,
            provider TEXT,
            model TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
                // Configuration table
                db.run(`
          CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
export function getDatabase() {
    return db;
}
