import Database, { RunResult } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ConfigKey } from '../shared/types';

// Create data directory if not exists
const dbPath = path.join(__dirname, '../data');
if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath);

const db = new Database(path.join(dbPath, 'amz_crawler.db'));

// Create products table
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,

    -- Amazon product fields
    asin TEXT,
    title TEXT,
    price TEXT,
    images TEXT,           -- JSON array of image URLs
    description TEXT,
    rating TEXT,
    reviews TEXT,      -- JSON array of review objects

    -- WooCommerce/WordPress fields
    wc_category TEXT,
    wc_tags TEXT,

    status TEXT NOT NULL DEFAULT 'import',  -- 'import', 'processing', 'done', 'error'
    error TEXT,
    crawled_at DATETIME
  );
`);

export function insertProduct({ url }: { url: string }): RunResult {
  // Check if the URL already exists
  const existingProduct = db.prepare(`SELECT * FROM products WHERE url = ?`).get(url);
  if (existingProduct) {
    throw new Error(`Product with URL ${url} already exists.`);
  }
  // Insert the new product
  const stmt = db.prepare(`INSERT INTO products (url, status) VALUES (?, 'import')`);
  const result = stmt.run(url);
  return result;
}

export function updateProduct({ id, data }: { id: number; data: any }) {
  // using ...rest operator to get all properties of data
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key) => `${key} = ?`).join(', ');
  const stmt = db.prepare(`UPDATE products SET ${setClause} WHERE id = ?`);
  const result = stmt.run(...values, id);
  if (result.changes === 0) {
    throw new Error(`No product found with id ${id}`);
  }
  return result;
}

export function getProductsByStatus({ status, limit }: { status: string; limit?: number }): any[] {
  let sql = `SELECT * FROM products WHERE status = ?`;
  if (limit) {
    sql += ` LIMIT ?`;
  }
  const stmt = db.prepare(sql);
  const params: any[] = [status];
  if (limit) {
    params.push(limit);
  }
  return stmt.all([...params]);
}
export function getAllProducts(): any[] {
  const stmt = db.prepare(`SELECT * FROM products`);
  return stmt.all();
}
export function getProductById({ id }: { id: number }): any {
  const stmt = db.prepare(`SELECT * FROM products WHERE id = ?`);
  return stmt.get(id);
}
export function deleteProduct({ id }: { id: number }): void {
  const stmt = db.prepare(`DELETE FROM products WHERE id = ?`);
  stmt.run(id);
}
export function getProductSummaryByStatus({ status }: { status: string }): any {
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM products WHERE status = ?`);
  const row: any = stmt.get(status);
  return row.count;
}
export function getProductSummary(): any {
  const stmt = db.prepare(`SELECT status, COUNT(*) as count FROM products GROUP BY status`);
  const rows = stmt.all();
  const summary: Record<string, number> = {};
  rows.forEach((row: any) => {
    summary[row.status] = row.count;
  });
  return summary;
}

// config table functions
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT
  );
`);
export function getAllConfig(): any[] {
  const stmt = db.prepare(`SELECT * FROM config`);
  return stmt.all();
}
export function getConfigValue({ key }: { key: string }): string | null {
  const row: any = db.prepare(`SELECT value FROM config WHERE key = ?`).get(key);
  return row?.value || null;
}

export function setConfigValue({ key, value }: { key: string; value: string }): void {
  db.prepare(
    `INSERT INTO config (key, value) VALUES (?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

export function updateConfigValue({ key, value }: { key: string; value: string }): void {
  db.prepare(`UPDATE config SET value = ? WHERE key = ?`).run(value, key);
}

export default db;

export const runDBFunction = {
  insertProduct,
  updateProduct,
  getAllConfig,
  getProductsByStatus,
  getAllProducts,
  getProductById,
  deleteProduct,
  getConfigValue,
  setConfigValue,
  updateConfigValue,
  getProductSummary,
  getProductSummaryByStatus
};

// Set default config if not already set
const defaultConfigs: Record<string, string> = {
  [ConfigKey.threadCount]: '2',
  [ConfigKey.delaySeconds]: '1'
};

const setDefaultConfig = db.prepare(`INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)`);
const setAllDefaults = db.transaction(() => {
  for (const [key, value] of Object.entries(defaultConfigs)) {
    setDefaultConfig.run(key, value);
  }
});
setAllDefaults();
