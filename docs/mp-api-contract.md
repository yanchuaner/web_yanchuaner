# 小程序 API 契约 v1

本文是网站、小程序和后续 App 之间的传输层基线。服务端实现位于 `src/app/api/mp`，共享 TypeScript DTO 与端点清单位于 `src/lib/mp-contract.ts`。

## 基础规则

- 基础路径：`/api/mp`
- 认证：`Authorization: Bearer <accessToken>`
- 时间：ISO 8601 字符串
- 空值：使用 `null`，不使用空字符串表达缺失
- 分页：`page` 从 1 开始，`pageSize` 默认 10、最大 50
- 响应头：`X-MP-API-Version: 1`
- 错误关联：响应体 `error.requestId` 与响应头 `X-Request-ID` 一致
- 缓存：API 响应统一 `Cache-Control: no-store`

成功响应：

```json
{ "ok": true, "data": {} }
```

错误响应：

```json
{
  "ok": false,
  "error": {
    "code": "MP_VALIDATION_ERROR",
    "message": "可展示给用户的简短提示",
    "requestId": "服务端请求编号"
  }
}
```

客户端只应根据 `error.code` 分支，`message` 用于展示，不作为程序判断条件。

## 端点

| 方法 | 路径 | 权限 | 用途 |
| --- | --- | --- | --- |
| POST | `/api/mp/auth/wechat-login` | 公开 | 用 `wx.login` code 换取访问令牌 |
| POST | `/api/mp/auth/dev-login` | 仅本地开发 | 白名单模拟用户登录，生产硬禁用 |
| GET | `/api/mp/auth/me` | 登录 | 获取精简会话状态 |
| GET/PATCH | `/api/mp/profile` | 登录 | 获取或修改可编辑个人资料 |
| GET/POST | `/api/mp/verification` | 登录 | 查询或提交身份认证 |
| GET | `/api/mp/news` | 登录 | 新闻分页列表 |
| GET | `/api/mp/news/[id]` | 登录 | 新闻详情 |
| GET | `/api/mp/events` | 登录 | 活动分页列表及当前用户报名状态 |
| GET | `/api/mp/events/[id]` | 登录 | 活动详情 |
| POST/DELETE | `/api/mp/events/[id]/registration` | 已认证 | 报名或取消报名 |
| GET | `/api/mp/registrations` | 登录 | 当前用户报名记录 |
| POST | `/api/mp/account/deletion` | 登录、非管理员 | 注销并匿名化账号 |

完整可机器检查的清单见 `MP_API_ENDPOINTS`。新增或删除端点时必须同步更新该常量和本文件，CI 会检查端点对应的 route handler 是否存在。

## 身份与权限状态

`user.accountState` 只有以下值：

| 值 | 含义 |
| --- | --- |
| `LOGGED_IN` | 已登录，尚未提交认证 |
| `PENDING` | 认证待审核 |
| `VERIFIED` | 已认证 |
| `REJECTED` | 认证被驳回，可修改后重新提交 |

`user.accessRole` 为 `USER` 或 `ADMIN`。业务身份使用 `identityType`：`ALUMNI`、`STUDENT`、`TEACHER` 或 `null`。

## 资料边界

`PATCH /api/mp/profile` 只允许 `contact`、`city`、`university`、`major`、`industry` 和 `contactVisibility`。姓名、毕业年份、班级、身份类型和认证状态属于认证资料，不能通过个人资料接口绕过审核修改。联系方式默认 `PRIVATE`，可选 `VERIFIED_USERS`。

## 主要错误码

| 错误码 | 客户端处理 |
| --- | --- |
| `MP_AUTH_REQUIRED` | 跳转登录 |
| `MP_AUTH_HEADER_INVALID` / `MP_TOKEN_INVALID` | 清理令牌并重新登录 |
| `MP_FORBIDDEN` | 展示权限说明，不重复提交 |
| `MP_VALIDATION_ERROR` | 展示字段错误 |
| `MP_RATE_LIMITED` | 读取 `Retry-After`，暂时禁用提交按钮 |
| `MP_VERIFICATION_PENDING` | 跳转认证进度页 |
| `MP_ALREADY_VERIFIED` | 刷新会话和资料 |
| `MP_EVENT_CLOSED` / `MP_EVENT_FULL` | 刷新活动详情 |
| `MP_ALREADY_REGISTERED` / `MP_REGISTRATION_NOT_FOUND` | 刷新报名状态 |
| `MP_INTERNAL_ERROR` | 展示通用提示并保留 `requestId` 供排查 |

全部错误码由 `MP_ERROR_CODES` 导出，禁止客户端自行拼接字符串。

## 兼容策略

- v1 内允许新增可选字段，不删除字段、不改变已有字段类型。
- 删除字段、改名、改变枚举语义或认证方式时，必须新建 `/api/mp/v2` 或提供明确迁移期。
- 客户端发现不支持的更高 `X-MP-API-Version` 时，应提示升级，而不是继续提交写请求。
- 微信 AppSecret 只保存在服务端；小程序包只包含 AppID 和 API 基础地址。
