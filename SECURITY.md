# 安全策略

## 报告安全问题

如果您发现安全漏洞，请**不要**在公开 Issue 中报告。请通过以下方式私下联系：

- 邮箱：yanchuan_alumni@163.com（请在标题注明 `[安全报告]`）

我们会在 7 天内确认收到报告，并在修复后公开致谢（如果您同意）。

## 敏感问题范围

以下类型的问题属于安全漏洞，请通过上述渠道报告：

- 权限绕过：普通用户访问管理员功能或 API
- 校友数据泄露：未授权获取校友姓名、班级、联系方式、证书编号
- 上传漏洞：绕过文件类型/大小限制、路径穿越
- XSS / CSRF 攻击
- CSV 注入导致公式执行
- 凭据泄露：SESSION_SECRET、密码哈希、token 暴露
- 生产数据库或备份文件泄露

## 安全边界

本项目为校友个人发起的公益项目，非商业服务。安全承诺：

- ✅ 所有管理员 API 需要 HMAC-SHA256 签名 token（httpOnly cookie）
- ✅ 校友数据 API 需要访问口令或管理员权限
- ✅ 上传文件校验 MIME 类型、大小限制、Sharp 处理
- ✅ CSV 导出防公式注入
- ✅ API 限流保护（join/posts/event registration）
- ✅ SQLite WAL 模式 + busy_timeout 5000ms
- ⚠️ 不承诺商业级 SLA
- ⚠️ 不提供实时入侵检测

## 凭据轮换

如果怀疑凭据已泄露：

1. 生成新的 SESSION_SECRET：`openssl rand -hex 32`
2. 生成新的密码哈希：`node -e "console.log(require('crypto').createHash('sha256').update('新密码').digest('hex'))"`
3. 更新服务器 `/var/www/alumni-site/.env`
4. 重启服务：`systemctl restart alumni-site`
5. 所有用户需要重新登录

## 生产部署安全检查清单

- [ ] `.env` 不包含示例/默认密码
- [ ] SESSION_SECRET 为随机 32 字节以上
- [ ] Nginx 已配置 HTTPS + Let's Encrypt
- [ ] `client_max_body_size` 限制上传大小
- [ ] 防火墙仅开放 80/443 端口
- [ ] 数据库文件权限 600，仅服务用户可读写
- [ ] 备份文件权限 600，不放在 web 可访问目录
- [ ] systemd 服务不以 root 运行（推荐）
- [ ] 定期执行备份并验证可恢复

## 支持版本

仅支持当前 `main` 分支最新版本。历史版本不提供安全补丁。
