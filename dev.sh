#!/usr/bin/env bash
# Enterprise Mind demo launcher: ./dev.sh [reset|stop]
set -euo pipefail
cd "$(dirname "$0")"

API_DIR="services/api"
WEB_DIR="apps/web"
DB="$API_DIR/enterprise_mind.db"

stop() {
  pkill -f "uvicorn app.main:app" 2>/dev/null || true
  pkill -f "next dev --port 3000" 2>/dev/null || true
  echo "stopped."
}

case "${1:-start}" in
  stop)
    stop
    ;;
  reset)
    stop
    sleep 1
    rm -f "$DB"
    echo "database reset — pristine demo state on next start."
    "$0" start
    ;;
  start)
    if [ ! -d "$API_DIR/.venv" ]; then
      echo "» creating python env…"
      (cd "$API_DIR" && uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python -r requirements.txt)
    fi
    if [ ! -d "$WEB_DIR/node_modules" ]; then
      echo "» installing web deps…"
      (cd "$WEB_DIR" && npm install)
    fi
    stop >/dev/null 2>&1 || true
    sleep 1
    echo "» starting API on :8000"
    (cd "$API_DIR" && nohup .venv/bin/uvicorn app.main:app --port 8000 > /tmp/em_api.log 2>&1 &)
    echo "» starting web on :3000"
    (cd "$WEB_DIR" && nohup npx next dev --port 3000 > /tmp/em_web.log 2>&1 &)
    sleep 4
    echo
    echo "Enterprise Mind is up:  http://localhost:3000   (API: http://localhost:8000/docs)"
    echo "Demo script: docs/demo-script.md · logs: /tmp/em_api.log /tmp/em_web.log"
    ;;
  *)
    echo "usage: ./dev.sh [start|reset|stop]"
    exit 1
    ;;
esac
