# 暑期试运营验收方案

目标是在邀请 5 至 10 名内部成员前，先用隔离数据完成自动化闭环，再开展 50 人以内的真实试运营。验收不使用生产数据库、真实名册或真实联系方式。

## 自动化闭环

```powershell
$env:DATABASE_URL="file:./.tmp/acceptance.db"
$env:NODE_ENV="development"
$env:SESSION_SECRET="acceptance-local-session-secret-at-least-32-chars"
$env:APP_URL="http://127.0.0.1:3101"
$env:SITE_URL="http://127.0.0.1:3101"
$env:ACCEPTANCE_ALLOW_MUTATION="true"
$env:MP_DEV_MOCK_LOGIN_ENABLED="true"
$env:MP_DEV_MOCK_USER_IDS="acceptance-verified,acceptance-candidate,acceptance-deletion"

npm run db:init
npm run seed:acceptance
npx next dev -H 127.0.0.1 -p 3101
```

服务启动后，在另一个终端执行：

```powershell
$env:ACCEPTANCE_BASE_URL="http://127.0.0.1:3101"
npm run test:acceptance
```

脚本覆盖网站管理员登录、受保护页面、管理员 API、小程序模拟登录、个人资料、新闻、活动、报名、取消报名、认证申请和账号注销。seed 和 smoke 都有保护条件，默认拒绝生产环境和远程地址。

## 人工验收矩阵

| 角色 | 必测流程 | 成功标准 |
| --- | --- | --- |
| 未登录访客 | 首页、关于、登录入口；直接访问新闻或活动 | 公开页可看，其他页面带原地址跳转登录 |
| 未认证校友 | 登录、提交姓名/毕业年份/班级、查看审核状态 | 唯一名册匹配和冲突都能进入待审核，不泄露名册详情 |
| 已认证校友 | 编辑选填资料、设置联系方式可见性、浏览新闻活动 | 只读认证字段不能绕过审核修改 |
| 已认证校友 | 活动报名、查看我的报名、取消报名 | 名额和状态一致，重复提交有明确提示 |
| 投稿用户 | 故事投稿、查看提交状态 | 提交中、成功、失败和审核状态清晰 |
| 管理员 | 查看待办、审核认证、发布新闻活动、导出报名 | 危险操作二次确认，关键操作有审计记录 |
| 普通用户 | 注销账号 | 个人字段匿名化、微信绑定删除、旧令牌立即失效 |

## 真实试运营步骤

1. 第一批 5 至 10 人只使用测试环境，至少包含管理员、已在名册校友和需要人工审核的冲突用户。
2. 每名测试者至少完成一次登录、认证、资料修改、内容浏览和活动报名。
3. 反馈只记录测试编号、时间、页面、操作和现象，不在群聊或 Issue 粘贴手机号、邮箱、令牌或真实个人资料截图。
4. P0 定义为登录、认证、报名、后台审核不可用或数据泄露；P0 修复后重新跑完整自动化闭环。
5. 连续 7 天无 P0、备份恢复演练成功后，才扩大到 50 人。

出现登录大面积失败、认证状态错乱、重复报名突破名额、管理员越权、联系方式泄露或 migration 异常时，立即停止测试并回滚。
