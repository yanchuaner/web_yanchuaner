#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# 清理残留 Node 进程（忽略无进程时的报错）。
killall -9 node 2>/dev/null || true

# 清理 Next 与工具缓存。
rm -rf .next node_modules/.cache

echo "? 宇宙中心已重置，准备重新发射！"
