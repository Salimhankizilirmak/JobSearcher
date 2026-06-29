import db from './database.js';

export async function initDb() {
  try {
    await db.connect();
    console.log('Database connection established.');

    // Enable foreign keys
    await db.run('PRAGMA foreign_keys = ON;');

    // 1. Companies Table
    await db.run(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        domain TEXT,
        email TEXT,
        industry TEXT,
        segment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Companies table created or already exists.');

    // 2. Jobs Table
    await db.run(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER,
        platform TEXT CHECK(platform IN ('LinkedIn', 'Kariyer.net', 'B2B_Platform')),
        title TEXT NOT NULL,
        description TEXT,
        url TEXT,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
      );
    `);
    console.log('Jobs table created or already exists.');

    // 3. Outreach Logs Table
    await db.run(`
      CREATE TABLE IF NOT EXISTS outreach_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        email_sent_to TEXT,
        pitch_body TEXT,
        status TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
      );
    `);
    console.log('Outreach Logs table created or already exists.');

    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
}

// If run directly
const runDirectly = process.argv[1] && (process.argv[1].endsWith('initDb.js') || process.argv[1].endsWith('initDb'));
if (runDirectly) {
  initDb()
    .then(async () => {
      await db.close();
      process.exit(0);
    })
    .catch(async (err) => {
      await db.close();
      process.exit(1);
    });
}
