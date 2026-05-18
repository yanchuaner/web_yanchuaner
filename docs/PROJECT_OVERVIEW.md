# 燕中校友数字母港

- 正式校名：燕川中学
- 简称：燕中
- 域名：yanchuaner.cn
- 服务器：华为云 ECS (Ubuntu)
- 定位：校友会展示、校友查询、新闻公告、活动报名、在校生资源、管理后台的公益数字平台。非官方、无盈利。

## 面向用户

| 角色 | 说明 |
|------|------|
| 普通访客 / 校友 | 进入网站浏览新闻、活动、校友故事，使用通讯录查询 |
| 在校生和家长 | 使用在校生资源站，获取升学参考、学习方法、学长问答等 |
| 管理员 | 登录后台管理新闻、活动、校友名单、审核修改申请 |

## 核心功能清单

| 功能 | 说明 |
|------|------|
| 普通口令入口 | 校友/访问者输入内测口令后进入网站 |
| 管理员登录 | 管理员账号 + HMAC-SHA256 token 登录 |
| 新闻管理 | 后台编辑、发布/下架、删除新闻；公开可访问 |
| 活动管理 | 后台编辑、发布/下架、删除活动；支持在线报名 |
| 活动报名名单导出 | 管理员导出 CSV（UTF-8 BOM，防公式注入）|
| 校友名单管理 | 后台 CRUD + CSV 导入/导出 |
| 校友信息修改申请 | 前台搜索自己姓名提交修改申请，管理员审核 |
| 在校生资源站 | 志愿填报参考、大学与专业观察、学长问答、学习方法、校友寄语 |
| 校友大学城市分布 | 城市级别的地图聚合展示，不显示个人位置信息 |
| 校友地图 | 从标签解析城市信息做分布展示 |
| 图片上传 | 管理员上传活动/新闻封面图片 |
| 联系我们 | 公开联系表单（邮箱引导）|

## 技术栈

- Next.js 14.2 (App Router, TypeScript)
- Prisma ORM (SQLite)
- Tailwind CSS 3.4
- Leaflet + react-leaflet 1.9.4（地图展示）
- Nginx + systemd 部署

## 数据持久化

| 路径 | 内容 |
|------|------|
| `prisma/dev.db` | 本地开发 SQLite 数据库 |
| `/var/www/alumni-site/data/prod.db` | 线上生产 SQLite 数据库 |
| `/var/www/alumni-site/uploads/` | 线上用户上传文件 |
| `public/uploads/` | 本地开发上传目录 |

> 不要用本地 dev.db 覆盖线上 prod.db。线上数据变更通过后台 UI 操作。

## 安全边界

| 层级 | 保护内容 | 验证方式 |
|------|----------|----------|
| 普通入口 | 整个站点访问 | `ACCESS_PASSWORD` / `ACCESS_PASSWORD_HASH`，httpOnly cookie |
| 管理员后台 | `/admin/*`、`/api/admin/*` | `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH`，httpOnly cookie |
| 校友数据 API | `/api/alumni/*` | `requireAccessOrAdmin()` — 普通口令或管理员均可 |
| 图片上传 | `/api/upload` | 仅管理员 |

> 环境变量只存变量名和用途说明，不写真实值。参见 `docs/OPERATIONS_GUIDE.md`。

## 项目结构

```
src/
├── app/
│   ├── admin/               # 后台管理页面
│   ├── alumni/              # 校友功能（地图、查询、修改申请等）
│   ├── api/                 # API 路由
│   ├── students/            # 在校生资源站
│   ├── events/              # 活动展示
│   ├── news/                # 新闻展示
│   └── ...                  # 其他页面
├── components/              # 通用组件
├── data/                    # 静态数据（城市坐标、资源站内容等）
├── lib/                     # 工具库（数据库、缓存、认证等）
└── styles/                  # 全局样式
docs/                        # 项目文档
prisma/                      # Prisma schema
```

## 相关文档

- [运营指南](OPERATIONS_GUIDE.md) — 本地开发、环境变量、后台操作
- [管理员使用手册](ADMIN_GUIDE.md) — 后台功能详细操作说明
- [部署与运维](DEPLOYMENT_GUIDE.md) — 构建、部署、Nginx、HTTPS
- [数据备份](BACKUP_GUIDE.md) — 备份与恢复操作
- [路由清单](ROUTES.md) — 所有页面与 API 路由及权限
- [故障排除](TROUBLESHOOTING.md) — 常见问题与修复
