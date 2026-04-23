import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

function resolveDbPath() {
  const configuredPath = process.env.DATABASE_PATH || './data/studycoach.db';
  const isVercel = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
  if (configuredPath === ':memory:') {
    return ':memory:';
  }

  if (isVercel) {
    if (path.isAbsolute(configuredPath) && configuredPath.startsWith('/tmp/')) {
      return configuredPath;
    }
    return path.resolve('/tmp', path.basename(configuredPath));
  }

  return path.resolve(process.cwd(), configuredPath);
}

function applyMigrations(connection) {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  connection.exec('PRAGMA foreign_keys = ON;');
  connection.exec(schema);
}

export function initializeDatabase(customPath) {
  if (db) {
    return db;
  }

  const dbPath = customPath || resolveDbPath();
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  db = new Database(dbPath);
  applyMigrations(db);
  return db;
}

export function getDb() {
  return db || initializeDatabase();
}

export function resetDatabaseForTests(testPath = ':memory:') {
  if (db) {
    db.close();
    db = null;
  }
  return initializeDatabase(testPath);
}

if (process.argv[1] === __filename) {
  const connection = initializeDatabase();
  connection.close();
}
