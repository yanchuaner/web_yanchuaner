const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const dbUrl = 'file:./prisma/dev.db'.replace('file:', '');
const dbPath = path.resolve(process.cwd(), dbUrl);
const db = new Database(dbPath);

const now = new Date().toISOString();
const data = [
  { page: 'about_timeline', title: '筹建成立', description: '学校事业单位登记成立，筹建名称为深圳市第十三高级中学', yearLabel: '2021', sortOrder: 0 },
  { page: 'about_timeline', title: '正式开学', description: '9月1日正式开学，首届高一年级招收20个班共1000人；同年加入新安中学(集团)', yearLabel: '2022', sortOrder: 1 },
  { page: 'about_timeline', title: '航天合作', description: '与中国航天科技国际交流中心合作，建成航天科技教育体验馆', yearLabel: '2022', sortOrder: 2 },
  { page: 'about_timeline', title: '航天特色', description: '航天科技特色项目列入宝安区重点工作；参与中国航天大会并获奖', yearLabel: '2023', sortOrder: 3 },
  { page: 'about_timeline', title: '建筑获奖', description: '获评ARCHINA年度最佳教育建筑TOP10', yearLabel: '2023', sortOrder: 4 },
  { page: 'about_timeline', title: '标杆学校', description: '获评广东省中小学智慧教育应用标杆校、宝安区首批教育数字化转型标杆学校', yearLabel: '2024', sortOrder: 5 },
  { page: 'about_timeline', title: '数字母港', description: '校友数字母港平台正式上线运营', yearLabel: '2025', sortOrder: 6 },
];

const insert = db.prepare('INSERT INTO ContentSection (id, page, title, description, note, icon, href, actionLabel, yearLabel, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

for (const d of data) {
  insert.run(crypto.randomUUID(), d.page, d.title, d.description, '', 'History', null, null, d.yearLabel, d.sortOrder, now, now);
}

const counts = db.prepare('SELECT page, COUNT(*) as cnt FROM ContentSection GROUP BY page').all();
console.log('Updated counts:');
counts.forEach(r => console.log(' ', r.page + ':', r.cnt));
db.close();
