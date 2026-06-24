import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

// In production on Vercel, set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
// (free Turso database — see README). Locally, with no env vars set,
// this falls back to a plain SQLite file on disk (./local.db) so you
// can run and test everything without creating any account first.
const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const db = createClient(authToken ? { url, authToken } : { url });

let ready = null;

export function getDb() {
  if (!ready) ready = initSchema();
  return ready.then(() => db);
}

async function initSchema() {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('Admin','Operator')),
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS vendors (
        name TEXT PRIMARY KEY
      )`,
      `CREATE TABLE IF NOT EXISTS parts (
        name TEXT PRIMARY KEY
      )`,
      `CREATE TABLE IF NOT EXISTS projects (
        name TEXT PRIMARY KEY
      )`,
      `CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        movement_type TEXT NOT NULL CHECK(movement_type IN ('DISPATCH','TRANSFER','RETURN')),
        challan_no TEXT NOT NULL,
        part_name TEXT NOT NULL,
        project TEXT,
        qty REAL NOT NULL,
        rejected_qty REAL NOT NULL DEFAULT 0,
        from_location TEXT NOT NULL,
        to_location TEXT NOT NULL,
        remarks TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_txn_challan ON transactions(challan_no)`,
      `CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(date)`
    ],
    "write"
  );

  await seedIfEmpty();
}

async function seedIfEmpty() {
  const vendorCount = await db.execute("SELECT COUNT(*) as c FROM vendors");
  if (Number(vendorCount.rows[0].c) === 0) {
    const defaultVendors = [
      "Aryan Heat Treatment",
      "Tarsem",
      "Tejinder",
      "DMK",
      "GS"
    ];
    for (const v of defaultVendors) {
      await db.execute({ sql: "INSERT OR IGNORE INTO vendors(name) VALUES (?)", args: [v] });
    }
  }

  const partCount = await db.execute("SELECT COUNT(*) as c FROM parts");
  if (Number(partCount.rows[0].c) === 0) {
    const defaultParts = [
      "Pin 24mm",
      "Pin 40mm",
      "Pin 36mm",
      "Shifter Rod",
      "Locking Pin",
      "Link Pin",
      "Swinging Link Pin"
    ];
    for (const p of defaultParts) {
      await db.execute({ sql: "INSERT OR IGNORE INTO parts(name) VALUES (?)", args: [p] });
    }
  }

  const userCount = await db.execute("SELECT COUNT(*) as c FROM users");
  if (Number(userCount.rows[0].c) === 0) {
    const adminHash = await bcrypt.hash("admin123", 10);
    const opHash = await bcrypt.hash("operator123", 10);
    await db.execute({
      sql: "INSERT INTO users(id,name,username,password_hash,role,created_at) VALUES (?,?,?,?,?,?)",
      args: ["u_admin", "Admin", "admin", adminHash, "Admin", new Date().toISOString()]
    });
    await db.execute({
      sql: "INSERT INTO users(id,name,username,password_hash,role,created_at) VALUES (?,?,?,?,?,?)",
      args: ["u_operator", "Operator", "operator", opHash, "Operator", new Date().toISOString()]
    });
  }
}

export async function addIfNew(table, name) {
  if (!name) return;
  await db.execute({ sql: `INSERT OR IGNORE INTO ${table}(name) VALUES (?)`, args: [name] });
}
