// backend/init.ts
import { sqlDb, saveDb } from "./connection.ts"; 


sqlDb.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    module TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );
`);


await saveDb(); 




