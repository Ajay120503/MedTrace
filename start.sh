#!/usr/bin/env bash
set -e

# ═════════════════════════════════════════════════════════════
# MedTrace — Project Starter
# Kills busy ports, starts MongoDB, seeds DB, launches API + Client
# ═════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_PORT=5000
CLIENT_PORT=5173

log()  { echo -e "${BLUE}[MedTrace]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; }

# ── Kill process on a port ──────────────────────────────────
kill_port() {
  local port=$1
  local pid
  pid=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    warn "Port $port is in use by PID $pid — killing..."
    kill -9 "$pid" 2>/dev/null || true
    sleep 1
    ok "Port $port freed"
  else
    ok "Port $port is free"
  fi
}

# ── Check prerequisites ─────────────────────────────────────
check_prereqs() {
  log "Checking prerequisites..."
  
  command -v node >/dev/null 2>&1 || { fail "Node.js is required"; exit 1; }
  command -v npm  >/dev/null 2>&1 || { fail "npm is required"; exit 1; }
  
  NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VER" -lt 18 ]; then
    fail "Node.js 18+ required (found v$(node -v))"
    exit 1
  fi
  ok "Node.js $(node -v)"
  ok "npm $(npm -v)"
  
  # Check MongoDB
  if command -v mongosh >/dev/null 2>&1; then
    if mongosh --quiet --eval "db.runCommand({ping:1}).ok" 2>/dev/null | grep -q 1; then
      ok "MongoDB is running"
    else
      warn "MongoDB not reachable — trying to start..."
      if command -v mongod >/dev/null 2>&1; then
        mongod --dbpath /tmp/medtrace-mongo --fork --logpath /tmp/medtrace-mongo.log 2>/dev/null || true
        sleep 2
        ok "MongoDB started"
      else
        fail "Cannot start MongoDB. Start it manually: mongod"
        exit 1
      fi
    fi
  else
    # Try connecting via Node
    if node -e "
      const mongoose = require('$PROJECT_DIR/server/node_modules/mongoose');
      mongoose.connect('mongodb://localhost:27017/medtrace')
        .then(() => { process.exit(0); })
        .catch(() => { process.exit(1); });
    " 2>/dev/null; then
      ok "MongoDB is running"
    else
      fail "MongoDB is not running. Start it with: mongod"
      exit 1
    fi
  fi
}

# ── Install dependencies if needed ──────────────────────────
install_deps() {
  log "Installing dependencies..."
  
  cd "$PROJECT_DIR/server"
  if [ ! -d "node_modules" ]; then
    npm install 2>&1 | tail -1
    ok "Server dependencies installed"
  else
    ok "Server dependencies already installed"
  fi
  
  cd "$PROJECT_DIR/client"
  if [ ! -d "node_modules" ]; then
    npm install 2>&1 | tail -1
    ok "Client dependencies installed"
  else
    ok "Client dependencies already installed"
  fi
  
  cd "$PROJECT_DIR"
}

# ── Seed database ───────────────────────────────────────────
seed_database() {
  log "Seeding database..."
  cd "$PROJECT_DIR/server"
  node src/seed.js 2>&1 | tail -3
  ok "Database seeded"
  cd "$PROJECT_DIR"
}

# ── Start API server ────────────────────────────────────────
start_server() {
  log "Starting API server on port $SERVER_PORT..."
  cd "$PROJECT_DIR/server"
  node src/index.js &
  SERVER_PID=$!
  echo "$SERVER_PID" > /tmp/medtrace-server.pid
  
  for i in $(seq 1 30); do
    if curl -s http://localhost:$SERVER_PORT/api/health >/dev/null 2>&1; then
      ok "API server is running (PID $SERVER_PID)"
      cd "$PROJECT_DIR"
      return 0
    fi
    sleep 1
  done
  
  fail "API server failed to start within 30 seconds"
  cd "$PROJECT_DIR"
  return 1
}

# ── Start client dev server ─────────────────────────────────
start_client() {
  log "Starting client dev server on port $CLIENT_PORT..."
  cd "$PROJECT_DIR/client"
  npm run dev -- --host 2>&1 &
  CLIENT_PID=$!
  echo "$CLIENT_PID" > /tmp/medtrace-client.pid
  
  for i in $(seq 1 30); do
    if curl -s http://localhost:$CLIENT_PORT >/dev/null 2>&1; then
      ok "Client dev server is running (PID $CLIENT_PID)"
      cd "$PROJECT_DIR"
      return 0
    fi
    sleep 1
  done
  
  warn "Client dev server may not be ready yet — continuing..."
  cd "$PROJECT_DIR"
}

# ── Stop services ───────────────────────────────────────────
stop_services() {
  log "Stopping services..."
  if [ -f /tmp/medtrace-server.pid ]; then
    kill "$(cat /tmp/medtrace-server.pid)" 2>/dev/null || true
    rm -f /tmp/medtrace-server.pid
    ok "API server stopped"
  fi
  if [ -f /tmp/medtrace-client.pid ]; then
    kill "$(cat /tmp/medtrace-client.pid)" 2>/dev/null || true
    rm -f /tmp/medtrace-client.pid
    ok "Client dev server stopped"
  fi
}

# ── Main ────────────────────────────────────────────────────
main() {
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║           MedTrace — Project Starter            ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
  
  MODE="${1:-dev}"
  
  case "$MODE" in
    dev)
      kill_port $SERVER_PORT
      kill_port $CLIENT_PORT
      check_prereqs
      install_deps
      seed_database
      start_server
      start_client
      echo ""
      echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
      echo -e "${GREEN}  MedTrace is running!${NC}"
      echo -e "${GREEN}  API:      http://localhost:$SERVER_PORT/api${NC}"
      echo -e "${GREEN}  Client:   http://localhost:$CLIENT_PORT${NC}"
      echo -e "${GREEN}  Press Ctrl+C to stop${NC}"
      echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
      echo ""
      trap 'stop_services; exit 0' INT
      while true; do sleep 1; done
      ;;
    server)
      kill_port $SERVER_PORT
      check_prereqs
      install_deps
      seed_database
      start_server
      echo ""
      echo -e "${GREEN}  API server running at http://localhost:$SERVER_PORT/api${NC}"
      echo -e "${GREEN}  Press Ctrl+C to stop${NC}"
      echo ""
      trap 'stop_services; exit 0' INT
      while true; do sleep 1; done
      ;;
    stop)
      stop_services
      kill_port $SERVER_PORT
      kill_port $CLIENT_PORT
      ok "All services stopped"
      ;;
    *)
      echo "Usage: ./start.sh [dev|server|stop]"
      echo "  dev      Start both API + Client (default)"
      echo "  server   Start API server only"
      echo "  stop     Stop all services"
      ;;
  esac
}

main "$@"