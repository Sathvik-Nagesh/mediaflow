import Database from '@tauri-apps/plugin-sql';

let dbInstancePromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstancePromise) return dbInstancePromise;
  
  dbInstancePromise = (async () => {
    const db = await Database.load('sqlite:mediaflow.db');
    // Create history table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        date TEXT NOT NULL,
        size TEXT,
        status TEXT NOT NULL,
        path TEXT
      )
    `);

    // Create settings table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    return db;
  })();

  return dbInstancePromise;
}

export async function initDb() {
  await getDb();
}

export async function getHistory() {
  const db = await getDb();
  return await db.select('SELECT * FROM history ORDER BY date DESC');
}

export async function saveHistory(item: any) {
  const db = await getDb();
  await db.execute(
    'INSERT OR REPLACE INTO history (id, title, url, date, size, status, path) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [item.id, item.title, item.url, item.date, item.size, item.status, item.path]
  );
}

export async function clearHistory() {
  const db = await getDb();
  await db.execute('DELETE FROM history');
}

export async function removeHistoryItem(id: string) {
  const db = await getDb();
  await db.execute('DELETE FROM history WHERE id = $1', [id]);
}

export async function getSetting(key: string, defaultValue: string = '') {
  const db = await getDb();
  const result = await db.select<{value: string}[]>('SELECT value FROM settings WHERE key = $1', [key]);
  return result.length > 0 ? result[0].value : defaultValue;
}

export async function saveSetting(key: string, value: string) {
  const db = await getDb();
  await db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)', [key, value]);
}
