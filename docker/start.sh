#!/usr/bin/env bash
set -e

# Launch FastAPI backend on 8000
python -m uvicorn src.server.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

trap 'kill $BACKEND_PID 2>/dev/null' EXIT

# Wait a moment for the backend to initialize
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
    echo "[start.sh] backend is up"
    break
  fi
  sleep 0.5
done

# Run Next.js standalone server in the foreground
export HOSTNAME=0.0.0.0
export PORT=${PORT:-3000}
node server.js
