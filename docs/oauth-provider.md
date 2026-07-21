# 燕中 API OAuth 身份出口

主站是燕中成员身份的唯一来源。API 平台通过短效 OAuth 授权码获取最小身份声明，不读取主站数据库，也不共享 `yc_access_token` Cookie。

## 端点

- `GET /api/oauth/authorize`
- `POST /api/oauth/token`
- `GET /api/oauth/userinfo`
- `GET /api/oauth/.well-known/openid-configuration`
- `GET /api/oauth/jwks`

只允许邮箱已验证、账号有效、审核状态为 `VERIFIED`，且身份为 `ALUMNI`、`STUDENT` 或 `TEACHER` 的用户；管理员用于统一运维。主站签发的粗粒度角色为 `alumni`、`student`、`teacher` 或 `admin`。授权码在 Redis 中保存 60 秒且只能消费一次，访问令牌保存 5 分钟。生产环境未配置 Redis 或 OAuth 环境变量时端点返回 `temporarily_unavailable`，不会降级为可重放的无状态授权码。

New API、Open WebUI 和自主燕中 AI Web 使用三个不同的机密客户端，分别限制精确回调并独立轮换密钥。Open WebUI 与自主 AI Web 通过标准 OIDC 发现文档接入，ID Token 使用主站持久化 RSA 私钥进行 RS256 签名，JWKS 仅发布公钥，并绑定 `aud` 与请求 `nonce`；API 平台继续使用 Token + UserInfo 的通用 OAuth 流程。

主站支持授权码流程的 S256 PKCE。发送 `code_challenge` 的客户端必须同时发送 `code_challenge_method=S256`，Token 请求必须提供匹配的 `code_verifier`；错误 verifier 会消费并作废一次性授权码。未发送 challenge 的既有机密客户端暂时保持兼容，新的燕中 AI Web 必须使用 PKCE、state 与 nonce。

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

## 自主燕中 AI Web OIDC 配置

| 配置 | 值 |
| --- | --- |
| Client ID | `YANCHUANER_AI_WEB_OAUTH_CLIENT_ID` |
| Client Secret | `YANCHUANER_AI_WEB_OAUTH_CLIENT_SECRET` |
| Discovery URL | `https://yanchuaner.cn/api/oauth/.well-known/openid-configuration` |
| Redirect URI | `https://ai.yanchuaner.cn/api/auth/callback` |
| Scope | `openid profile email` |

Open WebUI 与自主 AI Web 即使部署在同一域名，也不得复用 client ID 或 Secret。两个回调路径、会话实现和下游凭证归因不同，复用会破坏精确 `redirect_uri` 和独立撤销边界。

开发环境的发现文档为容器返回可达的 `host.docker.internal` Token/UserInfo 地址，但授权端点和回调保持浏览器可访问的 `localhost` 地址。生产环境两者均应使用正式 HTTPS 域名。

## 验证

```powershell
npm run test:oauth-provider
npx tsc --noEmit
npm run lint
```

本地隔离环境还必须执行真实 HTTP 合同验收。它会使用 `scripts/seed_acceptance.ts` 提供的假账号，向 Redis 写入短期测试授权码与访问令牌；默认拒绝生产环境和非本机地址。

```powershell
docker run --rm --name yanchuaner-oauth-contract-redis -p 127.0.0.1:6390:6379 redis:7.4-alpine@sha256:6ab0b6e7381779332f97b8ca76193e45b0756f38d4c0dcda72dbb3c32061ab99
```

在另一个 PowerShell 窗口中：

```powershell
$env:DATABASE_URL="file:./.tmp/oauth-contract.db"
$env:NODE_ENV="development"
$env:SESSION_SECRET="oauth-contract-local-session-secret-at-least-32-chars"
$env:REDIS_URL="redis://127.0.0.1:6390/0"
$env:YANCHUANER_OAUTH_CLIENT_ID="api-yanchuaner"
$env:YANCHUANER_OAUTH_CLIENT_SECRET="oauth-contract-client-secret"
$env:YANCHUANER_OAUTH_REDIRECT_URI="http://127.0.0.1:3191/oauth/yanchuaner"
$env:YANCHUANER_OAUTH_ISSUER="http://127.0.0.1:3191"
$env:YANCHUANER_OAUTH_INTERNAL_URL="http://127.0.0.1:3191"
$env:YANCHUANER_OAUTH_SIGNING_KEY=(node -e "const { generateKeyPairSync } = require('crypto'); process.stdout.write(generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({format:'der',type:'pkcs8'}).toString('base64'))")
$env:ACCEPTANCE_ALLOW_MUTATION="true"
$env:YANCHUANER_OAUTH_CONTRACT_ALLOW_TEST="true"

npm run db:init
npm run seed:acceptance
npx next dev -H 127.0.0.1 -p 3191
```

服务就绪后，在同一环境变量下执行：

```powershell
$env:YANCHUANER_OAUTH_CONTRACT_BASE_URL="http://127.0.0.1:3191"
npm run test:oauth-provider:contract
```

该合同覆盖发现文档、未登录跳转、精确回调地址、认证成员授权、非认证成员拒绝、S256 PKCE、一次性授权码、UserInfo、RS256/JWKS 与 `iss`、`aud`、`nonce` 绑定。通过合同后仍需在 Linux/HTTPS staging 验证 New API 的真实回调、管理员角色同步、Open WebUI 登录和账号停用后的重新授权。
