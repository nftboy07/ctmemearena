import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false } });
try {
  await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
  const dir = path.resolve("db/migrations");
  const files = (await fs.readdir(dir)).filter(f => f.endsWith(".sql")).sort();
  for (const filename of files) {
    const exists = await pool.query("SELECT 1 FROM schema_migrations WHERE filename=$1", [filename]);
    if (exists.rowCount) continue;
    const sql = await fs.readFile(path.join(dir, filename), "utf8");
    const client = await pool.connect();
    try { await client.query("BEGIN"); await client.query(sql); await client.query("INSERT INTO schema_migrations(filename) VALUES($1)", [filename]); await client.query("COMMIT"); console.log(`applied ${filename}`); }
    catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  console.log("migrations complete");
} finally { await pool.end(); }
