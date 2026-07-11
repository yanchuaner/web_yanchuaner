#!/bin/bash
# 校友会网站数据库自动备份脚本
# 用法: bash backup.sh [hourly|daily|weekly]
# 加入 crontab: 0 2 * * * /var/www/alumni-site/app/scripts/backup.sh daily

set -euo pipefail
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/var/backups/alumni-site}"
DB_PATH="${DATABASE_PATH:-/var/www/alumni-site/data/prod.db}"
UPLOADS_PATH="${UPLOAD_DIR:-/var/www/alumni-site/uploads}"
MODE="${1:-daily}"

case "$MODE" in
  hourly|daily|weekly) ;;
  *) echo "[ERROR] Mode must be hourly, daily, or weekly" >&2; exit 2 ;;
esac

command -v sqlite3 >/dev/null 2>&1 || {
  echo "[ERROR] sqlite3 is required for a WAL-safe backup" >&2
  exit 1
}

mkdir -p "$BACKUP_DIR"

# 使用 SQLite 在线备份 API，确保 WAL 中已提交的数据进入一致性快照。
if [ -f "$DB_PATH" ]; then
  DB_BACKUP="$BACKUP_DIR/prod-$TIMESTAMP.$MODE.db"
  DB_TEMP="$DB_BACKUP.tmp"
  trap 'rm -f "${DB_TEMP:-}"' EXIT
  sqlite3 "$DB_PATH" ".backup '$DB_TEMP'"
  CHECK_RESULT=$(sqlite3 "$DB_TEMP" "PRAGMA quick_check;")
  if [ "$CHECK_RESULT" != "ok" ]; then
    echo "[ERROR] Backup integrity check failed: $CHECK_RESULT" >&2
    exit 1
  fi
  mv "$DB_TEMP" "$DB_BACKUP"
  sha256sum "$DB_BACKUP" > "$DB_BACKUP.sha256"
  trap - EXIT
  echo "[OK] DB backed and verified: $(basename "$DB_BACKUP")"
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
find "$BACKUP_DIR" -name "*.hourly.db" -mmin +1440 -delete 2>/dev/null
find "$BACKUP_DIR" -name "*.hourly.db.sha256" -mmin +1440 -delete 2>/dev/null
find "$BACKUP_DIR" -name "*.daily.db" -mtime +30 -delete 2>/dev/null
find "$BACKUP_DIR" -name "*.daily.db.sha256" -mtime +30 -delete 2>/dev/null
find "$BACKUP_DIR" -name "*.weekly.db" -mtime +90 -delete 2>/dev/null
find "$BACKUP_DIR" -name "*.weekly.db.sha256" -mtime +90 -delete 2>/dev/null
find "$BACKUP_DIR" -name "uploads-*.tar.gz" -mtime +30 -delete 2>/dev/null

echo "[OK] Cleanup done."
