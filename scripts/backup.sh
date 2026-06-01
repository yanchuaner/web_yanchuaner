#!/bin/bash
# 校友会网站数据库自动备份脚本
# 用法: bash backup.sh [hourly|daily|weekly]
# 加入 crontab: 0 * * * * /var/www/alumni-site/backups/backup.sh hourly

set -euo pipefail
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/var/www/alumni-site/backups"
DB_PATH="/var/www/alumni-site/data/prod.db"
UPLOADS_PATH="/var/www/alumni-site/uploads"
MODE="${1:-daily}"

mkdir -p "$BACKUP_DIR"

# 数据库备份
if [ -f "$DB_PATH" ]; then
  cp "$DB_PATH" "$BACKUP_DIR/prod.db.$TIMESTAMP.$MODE"
  echo "[OK] DB backed: prod.db.$TIMESTAMP.$MODE"
else
  echo "[WARN] DB not found: $DB_PATH"
fi

# 上传文件完整备份（仅 daily/weekly）
if [ "$MODE" = "daily" ] || [ "$MODE" = "weekly" ]; then
  if [ -d "$UPLOADS_PATH" ]; then
    tar -czf "$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz" -C "$(dirname "$UPLOADS_PATH")" "$(basename "$UPLOADS_PATH")"
    echo "[OK] Uploads backed: uploads-$TIMESTAMP.tar.gz"
  fi
fi

# 清理旧备份
find "$BACKUP_DIR" -name "*.hourly" -mmin +1440 -delete 2>/dev/null  # daily 清每小时
find "$BACKUP_DIR" -name "*.daily" -mtime +30 -delete 2>/dev/null     # 30 days
find "$BACKUP_DIR" -name "*.weekly" -mtime +90 -delete 2>/dev/null    # 90 days

echo "[OK] Cleanup done."
