const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbUrl = (process.env.DATABASE_URL || 'file:./prisma/dev.db').replace('file:', '');
const dbPath = path.resolve(process.cwd(), dbUrl);
const db = new Database(dbPath);

function uuid() { return crypto.randomUUID(); }

db.exec(`
  CREATE TABLE IF NOT EXISTS ContentSection (
    id TEXT PRIMARY KEY,
    page TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    note TEXT DEFAULT '',
    icon TEXT DEFAULT 'BookOpen',
    href TEXT,
    actionLabel TEXT,
    yearLabel TEXT,
    sortOrder INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const insert = db.prepare(`
  INSERT OR IGNORE INTO ContentSection (id, page, title, description, note, icon, href, actionLabel, yearLabel, sortOrder, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Clear existing for clean re-seed (only these pages)
db.prepare("DELETE FROM ContentSection WHERE page IN ('about_features','about_timeline','contact','students','teachers')").run();

const now = new Date().toISOString();

const data = [
  // about_features
  { id: uuid(), page: 'about_features', title: '航天科技特色', description: '全国首批航天科技教育特色高中。建有深圳市中小学唯一的航天科技教育体验馆、太空探索工程实践室和航天卫星工程实践室。', icon: 'Rocket', sortOrder: 0 },
  { id: uuid(), page: 'about_features', title: '区位优势', description: '坐落于粤港澳大湾区核心区域——宝安区燕罗街道广田路108号，地处国际智能制造生态城。', icon: 'Globe2', sortOrder: 1 },
  { id: uuid(), page: 'about_features', title: '办学理念', description: '以"立德树人、创新发展"为核心办学理念，构建航天科技教育、智慧教育、个性教育三位一体的办学特色。', icon: 'GraduationCap', sortOrder: 2 },
  { id: uuid(), page: 'about_features', title: '校园规模', description: '占地面积8.7万平方米，建筑面积11万平方米，总投资11亿元。ARCHINA 2023年度最佳教育建筑TOP10。办学规模60个班。', icon: 'MapPin', sortOrder: 3 },
  { id: uuid(), page: 'about_features', title: '集团办学', description: '隶属深圳市新安中学（集团），校名"燕川"寓意"马踏飞燕，海纳百川"。', icon: 'Building2', sortOrder: 4 },
  { id: uuid(), page: 'about_features', title: '师资力量', description: '拥有正高级教师1名、高级教师25名、博士教师3名。获评广东省中小学智慧教育应用标杆校。', icon: 'Users', sortOrder: 5 },
  // about_timeline
  { id: uuid(), page: 'about_timeline', title: '筹建成立', description: '学校事业单位登记成立，筹建名称为"深圳市第十三高级中学"', yearLabel: '2021', sortOrder: 0 },
  { id: uuid(), page: 'about_timeline', title: '正式开学', description: '9月1日正式开学，首届高一年级招收20个班共1000人；同年加入新安中学（集团）', yearLabel: '2022', sortOrder: 1 },
  { id: uuid(), page: 'about_timeline', title: '航天合作', description: '与中国航天科技国际交流中心合作，建成航天科技教育体验馆', yearLabel: '2022', sortOrder: 2 },
  { id: uuid(), page: 'about_timeline', title: '航天特色', description: '航天科技特色项目列入宝安区重点工作；参与中国航天大会并获奖', yearLabel: '2023', sortOrder: 3 },
  { id: uuid(), page: 'about_timeline', title: '建筑获奖', description: '获评ARCHINA年度最佳教育建筑TOP10', yearLabel: '2023', sortOrder: 4 },
  { id: uuid(), page: 'about_timeline', title: '标杆学校', description: '获评广东省中小学智慧教育应用标杆校、宝安区首批教育数字化转型标杆学校', yearLabel: '2024', sortOrder: 5 },
  { id: uuid(), page: 'about_timeline', title: '数字母港', description: '校友数字母港平台正式上线运营', yearLabel: '2025', sortOrder: 6 },
  // contact
  { id: uuid(), page: 'contact', title: '联系邮箱', description: '网站维护、技术反馈、内容建议或活动合作，都可以发到这里。', note: 'yanchuan_alumni@163.com', icon: 'Mail', href: 'mailto:yanchuan_alumni@163.com', actionLabel: '发送邮件', sortOrder: 0 },
  { id: uuid(), page: 'contact', title: '校友投稿', description: '你的燕中故事值得被记住。课堂趣事、校园回忆、成长感悟、优秀成就，都欢迎来稿。审核后发布。', icon: 'MessageSquare', href: '/alumni/stories', actionLabel: '前往燕中故事投稿', sortOrder: 1 },
  { id: uuid(), page: 'contact', title: '活动合作', description: '想发起校友聚会、返校日或线上分享？告诉我们你的想法，我们帮你传播。', icon: 'CalendarDays', sortOrder: 2 },
  // students
  { id: uuid(), page: 'students', title: '志愿填报参考', description: '理解分数、位次、专业、城市、学校层次的思考框架，掌握信息收集方法，做出更明智的选择。', icon: 'School', href: '/students/application-guide', sortOrder: 0 },
  { id: uuid(), page: 'students', title: '大学与专业观察', description: '校友分享的大学生活体验与专业选择经验，帮助在校生提前了解真实的大学生活。', icon: 'Building2', href: '/students/university-insights', sortOrder: 1 },
  { id: uuid(), page: 'students', title: '学长问答', description: '精选问答，解答在校生和家长关于专业选择、志愿填报、大学适应的常见困惑。', icon: 'HelpCircle', href: '/students/senior-qa', sortOrder: 2 },
  { id: uuid(), page: 'students', title: '学习方法', description: '时间管理、复习策略、心态调整——整理高中阶段实用学习建议。', icon: 'GraduationCap', href: '/students/learning-methods', sortOrder: 3 },
  { id: uuid(), page: 'students', title: '校友寄语', description: '来自天南海北的学长学姐写给学弟学妹的话：关于选择、努力、大学与成长。', icon: 'Sparkles', href: '/students/alumni-messages', sortOrder: 4 },
  // teachers
  { id: uuid(), page: 'teachers', title: '教师名录', description: '燕川中学在职及退休教师基本信息（学科、教学特色等），帮助校友了解恩师近况。教师名录由学校或校友志愿者持续补充更新。', note: '教师信息收集整理中，欢迎校友提供资料', icon: 'BookOpen', sortOrder: 0 },
  { id: uuid(), page: 'teachers', title: '名师风采', description: '展示燕川中学优秀教师的先进事迹与教学成就，弘扬尊师重教的校园文化传统。', note: '风采内容征集中，欢迎投稿推荐', icon: 'Star', sortOrder: 1 },
  { id: uuid(), page: 'teachers', title: '科研与教学成果', description: '学校教学科研成果、公开课活动、课题研究进展等动态信息，让校友了解母校教学质量的不断提升。', note: '相关信息收集整理中', icon: 'Heart', sortOrder: 2 },
  { id: uuid(), page: 'teachers', title: '校友联络', description: '为校友提供一个安全的渠道向恩师表达问候。通过平台留言或邮件，传递对老师的感谢与祝福。', icon: 'MessageSquare', href: '/alumni/stories', actionLabel: '通过燕中故事投稿表达', sortOrder: 3 },
];

for (const d of data) {
  insert.run(d.id, d.page, d.title, d.description, d.note || '', d.icon || 'BookOpen', d.href || null, d.actionLabel || null, d.yearLabel || null, d.sortOrder, now, now);
}

const counts = db.prepare("SELECT page, COUNT(*) as cnt FROM ContentSection GROUP BY page").all();
console.log('Seeded ContentSection:');
counts.forEach(r => console.log(`  ${r.page}: ${r.cnt} items`));

db.close();
