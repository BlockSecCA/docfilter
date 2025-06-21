import { ipcMain } from 'electron';
import { getDatabase } from '../database/init';
import { processArtifact } from '../services/processor';
import { v4 as uuidv4 } from 'uuid';

export function registerIpcHandlers(): void {
  ipcMain.handle('process-artifact', async (event, data) => {
    try {
      const artifactId = uuidv4();
      const result = await processArtifact(data);
      
      const db = getDatabase();
      
      return new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO artifacts (id, type, source, extracted_content, ai_recommendation, ai_summary, ai_reasoning, provider, model, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))`,
          [
            artifactId,
            data.type,
            data.source,
            result.extractedContent,
            result.recommendation,
            result.summary,
            result.reasoning,
            result.provider,
            result.model
          ],
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({ id: artifactId, ...result });
            }
          }
        );
      });
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('get-artifacts', async () => {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM artifacts ORDER BY created_at DESC',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  });

  ipcMain.handle('get-artifact', async (event, id) => {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM artifacts WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  });

  ipcMain.handle('delete-artifact', async (event, id) => {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM artifacts WHERE id = ?',
        [id],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(undefined);
          }
        }
      );
    });
  });

  ipcMain.handle('get-config', async () => {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT key, value FROM config',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const config: any = {};
            rows.forEach((row: any) => {
              if (row.key === 'providers') {
                config[row.key] = JSON.parse(row.value);
              } else {
                config[row.key] = row.value;
              }
            });
            resolve(config);
          }
        }
      );
    });
  });

  ipcMain.handle('update-config', async (event, config) => {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        const stmt = db.prepare(
          'INSERT OR REPLACE INTO config (key, value, updated_at) VALUES (?, ?, datetime("now"))'
        );
        
        stmt.run('system_prompt', config.system_prompt);
        stmt.run('default_provider', config.default_provider);
        stmt.run('providers', JSON.stringify(config.providers));
        
        stmt.finalize((err) => {
          if (err) {
            reject(err);
          } else {
            resolve(undefined);
          }
        });
      });
    });
  });

  ipcMain.handle('reprocess-artifact', async (event, id) => {
    const db = getDatabase();
    
    // Get the original artifact
    const artifact: any = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM artifacts WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!artifact) {
      throw new Error('Artifact not found');
    }

    // Reprocess: Skip extraction, directly analyze existing content
    if (!artifact.extracted_content) {
      throw new Error('No extracted content available for reprocessing');
    }

    // Get current configuration
    const configRows: any[] = await new Promise((resolve, reject) => {
      db.all('SELECT key, value FROM config', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const config: any = {};
    configRows.forEach(row => {
      if (row.key === 'providers') {
        config[row.key] = JSON.parse(row.value);
      } else {
        config[row.key] = row.value;
      }
    });
    
    // Build LLM config
    const provider = config.default_provider || 'openai';
    const providers = config.providers || {};
    const systemPrompt = config.system_prompt || 'Analyze this content and recommend "Read" or "Discard" with reasoning.';
    
    if (!providers[provider]) {
      throw new Error(`No configuration found for provider: ${provider}`);
    }
    
    const llmConfig = {
      provider,
      config: providers[provider]
    };

    // Directly call LLM with existing extracted content
    const { callLLM } = await import('../services/llm');
    const llmResult = await callLLM(systemPrompt, artifact.extracted_content, llmConfig);
    
    const result = {
      extractedContent: artifact.extracted_content,
      recommendation: llmResult.recommendation,
      summary: llmResult.summary,
      reasoning: llmResult.reasoning,
      provider: llmResult.provider,
      model: llmResult.model
    };

    // Update the artifact
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE artifacts 
         SET ai_recommendation = ?, ai_summary = ?, ai_reasoning = ?, provider = ?, model = ?, updated_at = datetime('now', 'localtime')
         WHERE id = ?`,
        [result.recommendation, result.summary, result.reasoning, result.provider, result.model, id],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...result });
          }
        }
      );
    });
  });
}