#!/usr/bin/env bash
set -e

# ═════════════════════════════════════════════════════════════
# MedTrace — Test Suite
# Runs unit tests, API smoke tests, and frontend build check
# ═════════════════════════════════════════════════════════════

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; RED='\033[0;31m'; NC='\033[0m'
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"
SERVER_PORT=5000
PASS=0; FAIL=0

ok()   { echo -e "  ${GREEN}[✓]${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}[✗]${NC} $1"; FAIL=$((FAIL+1)); }

run_test() {
  local name="$1"; local cmd="$2"
  local out; out=$(eval "$cmd" 2>&1) && ok "$name" || { fail "$name"; echo "$out" | sed 's/^/       /'; }
}

# ═════════════════════════════════════════════════════════════
# UNIT TESTS (run from server dir with env vars)
# ═════════════════════════════════════════════════════════════

run_unit_tests() {
  echo -e "\n${YELLOW}═══ Unit Tests ═══${NC}"
  run_test "All unit tests" "cd $SERVER_DIR && NODE_ENV=test JWT_ACCESS_SECRET=test JWT_REFRESH_SECRET=test node src/__tests__/unit.test.js"
}

# ═════════════════════════════════════════════════════════════
# API SMOKE TESTS
# ═════════════════════════════════════════════════════════════

run_api_tests() {
  echo -e "\n${YELLOW}═══ API Smoke Tests ═══${NC}"
  local B="http://localhost:$SERVER_PORT/api"

  run_test "Health check" "curl -sf $B/health | grep -q '\"ok\"'"

  local PATIENT_ID=""
  local HOSPITAL_ID=""
  local DOCTOR_ID=""
  local ADMIN_ID=""

  # Patient registration (use unique email per run to avoid duplicates)
  local TS=$(date +%s)
  local PE="testp${TS}@test.com"
  local DE="testd${TS}@test.com"
  local AE="testa${TS}@test.com"
  
  local pr; pr=$(curl -sf -X POST "$B/patients/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test Patient\",\"dob\":\"1990-01-01\",\"gender\":\"Male\",\"mobile\":\"9876543210\",\"email\":\"${PE}\",\"bloodGroup\":\"O+\",\"password\":\"testpass123\"}" 2>/dev/null) && {
    PATIENT_ID=$(echo "$pr" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).patient._id)}catch(e){console.log('')}})")
    [ -n "$PATIENT_ID" ] && ok "Patient registered" || fail "Patient registration"
  } || fail "Patient registration"

  # Hospital registration
  local hr; hr=$(curl -sf -X POST "$B/hospitals/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Hospital","address":"123 St","contact":"9876543210"}' 2>/dev/null) && {
    HOSPITAL_ID=$(echo "$hr" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).hospital._id)}catch(e){console.log('')}})")
    [ -n "$HOSPITAL_ID" ] && ok "Hospital registered" || fail "Hospital registration"
  } || fail "Hospital registration"

  if [ -n "$HOSPITAL_ID" ]; then
    # Admin registration (use unique email)
    local ar; ar=$(curl -sf -X POST "$B/hospitals/admin/register" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Test Admin\",\"email\":\"${AE}\",\"password\":\"adminpass123\",\"hospitalId\":\"$HOSPITAL_ID\"}" 2>/dev/null) && {
      ADMIN_ID=$(echo "$ar" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).admin._id)}catch(e){console.log('')}})")
      [ -n "$ADMIN_ID" ] && ok "Admin registered" || fail "Admin registration"
    } || fail "Admin registration"

    # Doctor registration (use unique email)
    local dr; dr=$(curl -sf -X POST "$B/doctors/register" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Test Doctor\",\"specialization\":\"Cardiology\",\"hospitalId\":\"$HOSPITAL_ID\",\"registrationNumber\":\"REG123\",\"email\":\"${DE}\",\"mobile\":\"9876543211\",\"password\":\"docpass123\"}" 2>/dev/null) && {
      DOCTOR_ID=$(echo "$dr" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).doctor._id)}catch(e){console.log('')}})")
      [ -n "$DOCTOR_ID" ] && ok "Doctor registered" || fail "Doctor registration"
    } || fail "Doctor registration"
  fi

  # Login tests (use timestamped emails; no -f since login may fail for unverified doctors)
  run_test "Patient login" "curl -s -X POST $B/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"${PE}\",\"password\":\"testpass123\",\"role\":\"patient\"}' | grep -q 'OTP sent'"
  run_test "Doctor login" "curl -s -X POST $B/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"${DE}\",\"password\":\"docpass123\",\"role\":\"doctor\"}' | grep -q 'OTP sent'"
  run_test "Admin login" "curl -s -X POST $B/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"${AE}\",\"password\":\"adminpass123\",\"role\":\"admin\"}' | grep -q 'OTP sent'"

  # Auth rejection (must NOT use -f because 401 is expected)
  run_test "Auth rejection (no token)" "curl -s $B/patients/anything/history | grep -q 'Access token required'"

  # Drug reference
  local dc; dc=$(curl -sf "$B/drug-check/reference" 2>/dev/null)
  local count; count=$(echo "$dc" | node -e "process.stdin.on('data',d=>{try{console.log(JSON.parse(d).drugs.length)}catch(e){console.log('0')}})" 2>/dev/null)
  [ "$count" -ge 30 ] && ok "Drug reference ($count drugs)" || fail "Drug reference (only $count)"

  # Upload sign secured
  run_test "Upload sign secured" "curl -sf -X POST $B/uploads/sign -H 'Content-Type: application/json' -d '{\"folder\":\"patients/photos\"}' | grep -q 'Access token required'"
}

# ═════════════════════════════════════════════════════════════
# FRONTEND BUILD CHECK
# ═════════════════════════════════════════════════════════════

run_frontend_tests() {
  echo -e "\n${YELLOW}═══ Frontend Tests ═══${NC}"
  run_test "Frontend build" "cd $CLIENT_DIR && npm run build 2>&1 | tail -3 | grep -qi 'success'"
}

# ═════════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════════

main() {
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║        MedTrace — Test Suite                    ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"

  case "${1:-all}" in
    unit)     run_unit_tests ;;
    api)      run_api_tests ;;
    frontend) run_frontend_tests ;;
    all|*)
      run_unit_tests
      run_api_tests
      run_frontend_tests
      ;;
  esac

  echo ""
  echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
  echo -e "  ${GREEN}Passed: $PASS${NC}  ${RED}Failed: $FAIL${NC}"
  echo -e "${BLUE}══════════════════════════════════════════════════${NC}"
  echo ""
  [ "$FAIL" -gt 0 ] && exit 1 || exit 0
}

main "$@"