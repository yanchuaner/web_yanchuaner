# 数据备份与恢复指南

## 必须备份的内容

| 路径 | 说明 |
|------|------|
| `/var/www/alumni-site/data/prod.db` | SQLite 生产数据库（所有校友、新闻、活动、报名等数据）|
| `/var/www/alumni-site/uploads/` | 用户上传的图片文件 |

---

## 备份命令

### 一键备份

```bash
sudo tar -czf /var/www/alumni-site/backups/alumni-data-$(date +%Y%m%d-%H%M%S).tar.gz \
  /var/www/alumni-site/data/prod.db \
  /var/www/alumni-site/uploads
```

### 仅备份数据库

```bash
cp /var/www/alumni-site/data/prod.db \
  /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S)
```

### 备份清理建议

- 建议保留最近 30 天的每日备份。
- 每月保留一份月度备份。
- 可写脚本定期清理超过保留期的旧备份：

```bash
# 删除 30 天前的备份
find /var/www/alumni-site/backups -name "*.tar.gz" -mtime +30 -delete
find /var/www/alumni-site/backups -name "prod.db.*" -mtime +30 -delete
```

---

## 部署前自动备份

每次部署前必须备份生产数据库：

```bash
cp /var/www/alumni-site/data/prod.db \
  /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S).pre-deploy
```

---

## 恢复流程

### 恢复前必须确认

1. **当前数据状态**：确认恢复的必要性，是否可以通过后台操作修复。
2. **备份文件完整性**：检查备份文件是否存在、大小是否正常。
3. **备份时间点**：确认要恢复到哪个时间点的数据。

### 恢复步骤

1. **停止服务**，防止恢复过程中有新数据写入。

   ```bash
   sudo systemctl stop alumni-site
   ```

2. **备份当前状态**（万一恢复出错可以回退）。

   ```bash
   cp /var/www/alumni-site/data/prod.db \
     /var/www/alumni-site/backups/prod.db.$(date +%Y%m%d-%H%M%S).pre-restore
   ```

3. **恢复数据库**。

   ```bash
   # 从 tar.gz 恢复
   sudo tar -xzf /var/www/alumni-site/backups/alumni-data-XXXXXXXX-XXXXXX.tar.gz \
     -C /var/www/alumni-site/

   # 或者从单文件备份恢复
   sudo cp /var/www/alumni-site/backups/prod.db.XXXXXXXX-XXXXXX \
     /var/www/alumni-site/data/prod.db
   ```

4. **恢复上传文件**（如果备份中包含）。

   ```bash
   sudo tar -xzf /var/www/alumni-site/backups/alumni-data-XXXXXXXX-XXXXXX.tar.gz \
     -C /var/www/alumni-site/ --wildcards '*/uploads/*'
   ```

5. **启动服务**。

   ```bash
   sudo systemctl start alumni-site
   ```

6. **验证数据**：访问网站确认数据正确。

---

## 安全原则

- **不要用旧库覆盖新库**：除非你确认旧库中的数据比当前库更新或当前库已损坏。
- **恢复前必须先备份当前状态**：确保恢复操作可逆。
- 恢复完成后验证关键数据（新闻、活动、校友名单）是否完整。
- 如果恢复后发现数据不完整，可以从 pre-restore 备份回退。

---

## 线下备份建议

定期将线上备份下载到本地：

```bash
# 从服务器下载备份（在本地执行）
scp user@server:/var/www/alumni-site/backups/prod.db.$(date +%Y%m%d).pre-deploy \
  ./offline-backup/
```

---

## 相关文档

- [部署与运维指南](DEPLOYMENT_GUIDE.md) — 部署流程中的备份步骤
- [管理员使用手册](ADMIN_GUIDE.md) — 误操作处理
