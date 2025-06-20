import Database from 'sqlite3';
export declare function initDatabase(): Promise<void>;
export declare function getDatabase(): Database.Database;
