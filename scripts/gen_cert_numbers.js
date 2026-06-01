const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dev.db');
const db = new Database(dbPath);

// 8 位核心成员姓名
const CORE_NAMES = ['黄湘林', '左佳维', '张正朋', '吴桐', '杨菁', '赖盈燕', '朱国震', '张一鸣'];

// 1. 核心成员 certificateNo 置空
const placeholders = CORE_NAMES.map(() => '?').join(',');
db.prepare(`UPDATE WhitelistRoster SET certificateNo = NULL WHERE name IN (${placeholders})`).run(...CORE_NAMES);
console.log(`${CORE_NAMES.length} 位核心成员编号已留空`);

// 2. 其余成员按 name 排序，生成 YC-2022-0001 ~
const allRows = db.prepare("SELECT id, name FROM WhitelistRoster ORDER BY name").all();

const coreSet = new Set(CORE_NAMES);
const updateStmt = db.prepare("UPDATE WhitelistRoster SET certificateNo = ? WHERE id = ?");

let seq = 0;
const updateAll = db.transaction(() => {
  for (const row of allRows) {
    if (coreSet.has(row.name)) continue;
    seq++;
    const certNo = `YC-2022-${String(seq).padStart(4, '0')}`;
    updateStmt.run(certNo, row.id);
  }
});

updateAll();
console.log(`${seq} 位非核心成员已生成编号 (YC-2022-0001 ~ YC-2022-${String(seq).padStart(4, '0')})`);

db.close();
