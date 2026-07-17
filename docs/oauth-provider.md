# 燕中 API OAuth 身份出口

主站是燕中成员身份的唯一来源。API 平台通过短效 OAuth 授权码获取最小身份声明，不读取主站数据库，也不共享 `yc_access_token` Cookie。

## 端点

- `GET /api/oauth/authorize`
- `POST /api/oauth/token`
- `GET /api/oauth/userinfo`
- `GET /api/oauth/.well-known/openid-configuration`
- `GET /api/oauth/jwks`

只允许邮箱已验证、账号有效、审核状态为 `VERIFIED`，且身份为 `ALUMNI`、`STUDENT` 或 `TEACHER` 的用户；管理员用于统一运维。主站签发的粗粒度角色为 `alumni`、`student`、`teacher` 或 `admin`。授权码在 Redis 中保存 60 秒且只能消费一次，访问令牌保存 5 分钟。生产环境未配置 Redis 或 OAuth 环境变量时端点返回 `temporarily_unavailable`，不会降级为可重放的无状态授权码。

New API 和 Open WebUI 使用不同客户端密钥。Open WebUI 通过标准 OIDC 发现文档接入，ID Token 使用主站持久化 RSA 私钥进行 RS256 签名，JWKS 仅发布公钥，并绑定 `aud` 与请求 `nonce`；API 平台继续使用 Token + UserInfo 的通用 OAuth 流程。

燕中 API 关闭本地密码登录与密码注册，只保留主站 SSO。New API 仅信任 slug 为 `yanchuaner` 的提供方同步角色：主站 `admin` 对应 New API root，三类普通认证成员对应普通用户；其他通用 OAuth 提供方不能借同名字段提权。

## New API 自定义 OAuth 配置

| 配置 | 值 |
| --- | --- |
| Client ID | `YANCHUANER_OAUTH_CLIENT_ID` |
| Client Secret | `YANCHUANER_OAUTH_CLIENT_SECRET` |
| Authorization URL | `https://yanchuaner.cn/api/oauth/authorize` |
| Token URL | `https://yanchuaner.cn/api/oauth/token` |
| User info URL | `https://yanchuaner.cn/api/oauth/userinfo` |
| Scope | `openid profile email` |
| User ID field | `sub` |
| Username field | `preferred_username` |
| Display name field | `name` |
| Email field | `email` |

回调地址必须与 `YANCHUANER_OAUTH_REDIRECT_URI` 完全一致。生产值预计为 `https://api.yanchuaner.cn/oauth/yanchuaner`，以实际配置的 OAuth slug 为准。

## Open WebUI OIDC 配置

| 配置 | 值 |
| --- | --- |
| Client ID | `YANCHUANER_AI_OAUTH_CLIENT_ID` |
| Client Secret | `YANCHUANER_AI_OAUTH_CLIENT_SECRET` |
| Discovery URL | `https://yanchuaner.cn/api/oauth/.well-known/openid-configuration` |
| Redirect URI | `https://ai.yanchuaner.cn/oauth/oidc/callback` |
| Scope | `openid profile email` |

开发环境的发现文档为容器返回可达的 `host.docker.internal` Token/UserInfo 地址，但授权端点和回调保持浏览器可访问的 `localhost` 地址。生产环境两者均应使用正式 HTTPS 域名。

## 验证

```powershell
npm run test:oauth-provider
npx tsc --noEmit
npm run lint
```

部署前还需在真实 Redis 上验证三类认证成员登录、管理员角色同步、未登录跳转、未认证拒绝、本地密码拒绝、错误回调地址、授权码重放和账号停用后的重新授权。
