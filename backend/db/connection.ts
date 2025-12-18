// backend/db/connection.ts
import initSqlJs from "sql.js";

// Resolve the wasm file location for sql.js
const wasmUrl = import.meta.resolve("sql.js/dist/sql-wasm.wasm");
const SQL = await initSqlJs({
  locateFile: () => wasmUrl,
});

// Database file path
const DB_FILE = "./db/tasks.db";

// Ensure the database directory exists
try { 
  await Deno.mkdir("./db", { recursive: true }); 
} catch {
  // Directory already exists or permission error
}

// Load existing database from disk or initialize empty
let initial: Uint8Array | null = null;
try {
  initial = await Deno.readFile(DB_FILE);
} catch {
  initial = null;
}

// Create the SQL instance
export const sqlDb = initial ? new SQL.Database(initial) : new SQL.Database();

// --- SCHEMA BOOTSTRAP ---

// 1. Create Tasks Table
// Note: Includes userId to support multi-user separation
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

// 2. Create Users Table
sqlDb.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

/**
 * Exports the current in-memory database state and writes it to the disk.
 */
export async function saveDb() {
  const data = sqlDb.export();
  await Deno.writeFile(DB_FILE, data);
}

