const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Database = require('better-sqlite3');
const crypto = require('crypto');

require('dotenv').config();

const dbUrl = (process.env.DATABASE_URL || 'file:./dev.db').replace('file:', '');
const dbPath = path.resolve(process.cwd(), dbUrl);
const db = new Database(dbPath);

function normalizeGraduationClass(value) {
  const normalized = String(value || '').trim().normalize('NFC');
  const match = normalized.match(/^(20\d{2})届?$/);
  return match ? match[1] : normalized;
}

async function main() {
  const csvFilePath = path.join(__dirname, '../alumni_roster.csv');
  const fileStream = fs.createReadStream(csvFilePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  // Ensure table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS WhitelistRoster (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      graduationClass TEXT,
      tags TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const insert = db.prepare('INSERT INTO WhitelistRoster (id, name, graduationClass, tags) VALUES (?, ?, ?, ?)');

  let isFirstLine = true;
  let count = 0;

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    const [name, graduationClass, message, university, major, city] = line.split(',');

    if (!name) continue;

    const tags = [university, major, city].filter(Boolean).map(s => s.trim()).join(' | ');

    insert.run(
      crypto.randomUUID(),
      name.trim(),
      graduationClass ? normalizeGraduationClass(graduationClass) : null,
      tags ? tags.trim() : null
    );
    count++;
  }

  console.log(`Seeded ${count} alumni records directly via better-sqlite3.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    db.close();
  });
