# 路由清单

## 权限标记

| 标记 | 说明 |
|------|------|
| ✅ 公开 | 无需任何凭据即可访问 |
| 🔑 普通口令 | 需要 `ACCESS_PASSWORD` / `ACCESS_PASSWORD_HASH` 验证 |
| 🔐 管理员 | 需要 `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` 验证 |

---

## 前台页面

| 路由 | 权限 | 说明 |
|------|------|------|
| `/` | 🔑 普通口令 | 首页 |
| `/students` | ✅ 公开 | 在校生资源站入口 |
| `/students/application-guide` | ✅ 公开 | 志愿填报参考 |
| `/students/university-insights` | ✅ 公开 | 大学与专业观察 |
| `/students/senior-qa` | ✅ 公开 | 学长问答 |
| `/students/learning-methods` | ✅ 公开 | 学习方法 |
| `/students/alumni-messages` | ✅ 公开 | 校友寄语 |
| `/news` | ✅ 公开 | 新闻列表 |
| `/news/[id]` | ✅ 公开 | 新闻详情 |
| `/events` | ✅ 公开 | 活动列表 |
| `/events/[id]` | ✅ 公开 | 活动详情与报名 |
| `/alumni/correction` | 🔑 普通口令 | 校友信息修改申请 |
| `/alumni/university-map` | 🔑 普通口令 | 校友大学城市分布 |
| `/alumni/radar` | 🔑 普通口令 | 重定向至 `/alumni/university-map` |
| `/alumni/certificate` | 🔑 普通口令 | 校友电子证书 |
| `/alumni/memories` | 🔑 普通口令 | 校园记忆 |
| `/alumni/stories` | 🔑 普通口令 | 燕中故事 |
| `/contact` | ✅ 公开 | 联系我们 |

> 前台路由中标记为 🔑 普通口令的页面，其数据 API 也通过 `requireAccessOrAdmin()` 保护。未通过验证时 API 返回 401。

---

## 后台页面

| 路由 | 权限 | 说明 |
|------|------|------|
| `/admin` | 🔐 管理员 | 管理控制面板 |
| `/admin/login` | ✅ 公开 | 管理员登录页 |
| `/admin/news` | 🔐 管理员 | 新闻管理列表 |
| `/admin/news/new` | 🔐 管理员 | 新建新闻 |
| `/admin/news/[id]` | 🔐 管理员 | 编辑新闻 |
| `/admin/events` | 🔐 管理员 | 活动管理列表 |
| `/admin/events/new` | 🔐 管理员 | 新建活动 |
| `/admin/events/[id]` | 🔐 管理员 | 编辑活动 |
| `/admin/events/[id]/registrations` | 🔐 管理员 | 活动报名名单 |
| `/admin/alumni` | 🔐 管理员 | 校友名单管理（CRUD、导入导出）|
| `/admin/alumni-corrections` | 🔐 管理员 | 校友信息修改申请审核 |
| `/admin/posts` | 🔐 管理员 | 投稿管理 |
| `/admin/users` | 🔐 管理员 | 用户管理 |

---

## 主要 API

| 路由 | 权限 | 方法 | 说明 |
|------|------|------|------|
| `/api/auth/verify` | 🔑 普通口令 | GET | 验证当前 cookie 是否有效 |
| `/api/auth/logout` | — | POST | 清除登录 cookie |
| | | | |
| `/api/alumni/search` | 🔑 普通口令 | GET | 校友搜索（按姓名/届别/标签）|
| `/api/alumni/map` | 🔑 普通口令 | GET | 校友地图数据（姓名+城市）|
| `/api/alumni/city-stats` | 🔑 普通口令 | GET | 校友城市聚合统计 |
| `/api/alumni/correction-requests` | 🔑 普通口令 | POST | 提交校友信息修改申请 |
| `/api/alumni/verify` | 🔑 普通口令 | GET | 校友身份验证 |
| | | | |
| `/api/admin/stats` | 🔐 管理员 | GET | 后台统计概览 |
| `/api/admin/news` | 🔐 管理员 | GET/POST | 新闻 CRUD |
| `/api/admin/news/[id]` | 🔐 管理员 | GET/PUT/DELETE | 单条新闻操作 |
| `/api/admin/events` | 🔐 管理员 | GET/POST | 活动 CRUD |
| `/api/admin/events/[id]` | 🔐 管理员 | GET/PUT/DELETE | 单个活动操作 |
| `/api/admin/events/[id]/registrations` | 🔐 管理员 | GET | 报名名单 |
| `/api/admin/alumni` | 🔐 管理员 | GET/POST | 校友名单 CRUD |
| `/api/admin/alumni/[id]` | 🔐 管理员 | PUT/DELETE | 单个校友操作 |
| `/api/admin/alumni/import` | 🔐 管理员 | POST | CSV 导入 |
| `/api/admin/alumni-corrections` | 🔐 管理员 | GET | 修改申请列表 |
| `/api/admin/alumni-corrections/[id]` | 🔐 管理员 | PUT | 审核修改申请 |
| `/api/admin/posts` | 🔐 管理员 | GET/POST | 投稿管理 |
| `/api/admin/posts/[id]` | 🔐 管理员 | PUT/DELETE | 单个投稿操作 |
| `/api/admin/users` | 🔐 管理员 | GET | 用户管理 |
| | | | |
| `/api/upload` | 🔐 管理员 | POST | 图片上传 |
| `/api/health` | ✅ 公开 | GET | 健康检查 |
| `/api/join` | ✅ 公开 | POST | 加入申请 |
| `/api/news` | ✅ 公开 | GET | 公开新闻列表 |
| `/api/news/[id]` | ✅ 公开 | GET | 新闻详情 |
| `/api/events` | ✅ 公开 | GET | 公开活动列表 |
| `/api/events/[id]` | ✅ 公开 | GET | 活动详情 |

---

## 认证机制说明

### 普通口令（Access Token）

- cookie 名：`yc_access_token`
- payload 包含 `{ role: "access" }` 或 `{ role: "admin" }`
- 验证函数：`verifyToken()`（HMAC-SHA256）
- 保护函数：`requireAccessOrAdmin()`

### 管理员（Admin Token）

- cookie 名：`yc_access_token`
- payload 包含 `{ role: "admin" }`
- 保护函数：`requireAdmin()`

### 未登录或凭据过期

- 页面：不拦截页面访问，但数据 API 返回 401。
- API：返回 `{ error: "Unauthorized" }`，HTTP 状态码 401。

---

## 校园记忆页面路由说明

`/alumni/memories` 页面访问本身需要普通口令验证，但其使用的图片资源来自 `public/` 目录，不经过 API 鉴权。如果上传了敏感照片，应控制好图片本身的访问权限。
