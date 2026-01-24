import { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

let testDb: Database | null = null;

/**
 * Sets up an in-memory SQLite database for testing.
 * Runs all migrations from server/db/migrations/
 */
export function setupTestDb(): Database {
  // Create in-memory database
  testDb = new Database(":memory:");

  // Enable foreign keys and WAL mode (WAL has no effect on :memory: but included for parity)
  testDb.exec("PRAGMA foreign_keys = ON;");
  testDb.exec("PRAGMA journal_mode = WAL;");

  // Create migrations tracking table
  testDb.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Run migrations
  // Path from server/__tests__/fixtures/ -> server/db/migrations/
  const migrationsDir = join(import.meta.dir, "../../db/migrations");

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    testDb.transaction(() => {
      testDb!.exec(sql);
      testDb!.run("INSERT INTO _migrations (name) VALUES (?)", [file]);
    })();
  }

  return testDb;
}

/**
 * Returns the current test database instance.
 * Throws if setupTestDb() hasn't been called.
 */
export function getTestDb(): Database {
  if (!testDb) {
    throw new Error(
      "Test database not initialized. Call setupTestDb() first."
    );
  }
  return testDb;
}

/**
 * Closes and cleans up the test database.
 */
export function teardownTestDb(): void {
  if (testDb) {
    testDb.close();
    testDb = null;
  }
}
