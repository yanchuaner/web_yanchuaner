const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbUrl = (process.env.DATABASE_URL || 'file:./prisma/dev.db').replace('file:', '');
const dbPath = path.resolve(process.cwd(), dbUrl);
const db = new Database(dbPath);

function uuid() { return crypto.randomUUID(); }

db.exec(`
  CREATE TABLE IF NOT EXISTS Story (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    body TEXT DEFAULT '',
    date TEXT DEFAULT '',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const stories = require('../src/data/stories.json');
const now = new Date().toISOString();

const insert = db.prepare('INSERT OR IGNORE INTO Story (id, title, author, tags, body, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

let count = 0;
for (const s of stories) {
  insert.run(s.id, s.title, s.author, JSON.stringify(s.tags), s.body, s.date, now, now);
  count++;
}

console.log(`Seeded ${count} stories`);
db.close();
