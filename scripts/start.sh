#!/usr/bin/env bash
set -euo pipefail

# Resolve Pearson root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

print_banner() {
  echo -e "\n${CYAN}══════════════════════════════════════════════════${NC}"
  echo -e "  ${BOLD}$1${NC}"
  echo -e "${CYAN}══════════════════════════════════════════════════${NC}"
}

# Detect Docker / sudo on Linux
DOCKER_CMD="docker"
if ! docker info >/dev/null 2>&1; then
  if sudo docker info >/dev/null 2>&1; then
    DOCKER_CMD="sudo docker"
  else
    echo -e "${RED}✖ Docker daemon is not running or inaccessible.${NC}"
    exit 1
  fi
fi

FORCE_BUILD=false
if [[ "${1:-}" == "--build" || "${1:-}" == "-b" ]]; then
  FORCE_BUILD=true
fi

# --------------------------------------------------
# STEP 1 · Smart Build & Container Launch
# --------------------------------------------------
print_banner "STEP 1 · Checking Changes & Launching Containers"

HASH_FILE="$PROJECT_ROOT/.pearson-build.hash"

# Fingerprint Dockerfiles, compose files, and dependency manifests
CURRENT_HASH=$(
  find "$PROJECT_ROOT" -maxdepth 4 \
    \( -name "Dockerfile*" -o -name "docker-compose*.yml" -o -name "compose*.yml" \
       -o -name "pnpm-lock.yaml" -o -name "package.json" -o -name "uv.lock" -o -name "pyproject.toml" \) \
    -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.venv/*" \
    -print0 2>/dev/null \
  | sort -z \
  | xargs -0 sha256sum 2>/dev/null \
  | sha256sum | awk '{print $1}'
)

SAVED_HASH=""
[[ -f "$HASH_FILE" ]] && SAVED_HASH=$(cat "$HASH_FILE")

# Also check if custom images exist yet
IMAGES_EXIST=true
for img in pearson-agent pearson-api pearson-web; do
  if ! $DOCKER_CMD image inspect "$img:latest" >/dev/null 2>&1; then
    IMAGES_EXIST=false
    break
  fi
done

if [[ "$FORCE_BUILD" == "true" || "$IMAGES_EXIST" == "false" || "$CURRENT_HASH" != "$SAVED_HASH" ]]; then
  echo -e "${YELLOW}⚡ Changes detected (or first build) — building images...${NC}"
  $DOCKER_CMD compose up -d --build
  echo "$CURRENT_HASH" > "$HASH_FILE"
else
  echo -e "${GREEN}⚡ No build/dependency changes — skipping build (fast start)...${NC}"
  $DOCKER_CMD compose up -d --no-build
fi

echo -e "${GREEN}✔ All containers launched.${NC}"

# --------------------------------------------------
# STEP 2 · Health Check — Waiting for Containers
# --------------------------------------------------
print_banner "STEP 2 · Health Check — Waiting for Containers"

HEALTHCHECK_SERVICES=(
  "pearson-postgres"
  "pearson-redis"
  "pearson-mongo"
  "pearson-kafka"
)

for svc in "${HEALTHCHECK_SERVICES[@]}"; do
  printf "  %-25s " "$svc"
  for i in {1..45}; do
    STATUS=$($DOCKER_CMD inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$svc" 2>/dev/null || echo "missing")
    if [[ "$STATUS" == "healthy" ]]; then
      echo -e "${GREEN}✔ healthy${NC}"
      break
    elif [[ "$i" -eq 45 ]]; then
      echo -e "${RED}✖ timeout ($STATUS)${NC}"
      exit 1
    fi
    sleep 1
  done
done

RUNNING_SERVICES=(
  "pearson-freellmapi"
  "pearson-agent"
  "pearson-api"
  "pearson-web"
)

for svc in "${RUNNING_SERVICES[@]}"; do
  printf "  %-25s " "$svc"
  STATUS=$($DOCKER_CMD inspect --format='{{.State.Status}}' "$svc" 2>/dev/null || echo "missing")
  if [[ "$STATUS" == "running" ]]; then
    echo -e "${GREEN}✔ running${NC}"
  else
    echo -e "${RED}✖ $STATUS${NC}"
    exit 1
  fi
done

# --------------------------------------------------
# STEP 3 · FreeLLM API Key Check
# --------------------------------------------------
print_banner "STEP 3 · FreeLLM API Key Setup"

ENV_FILE="$PROJECT_ROOT/.env"
if [[ -f "$ENV_FILE" ]] && grep -Eq '^GOOGLE_API_KEY=.+' "$ENV_FILE"; then
  echo -e "${GREEN}✔ GOOGLE_API_KEY is already set in .env — skipping.${NC}"
else
  read -rp "Enter GOOGLE_API_KEY (or press Enter to skip): " INPUT_KEY
  if [[ -n "$INPUT_KEY" ]]; then
    touch "$ENV_FILE"
    if grep -q '^GOOGLE_API_KEY=' "$ENV_FILE"; then
      sed -i "s|^GOOGLE_API_KEY=.*|GOOGLE_API_KEY=$INPUT_KEY|" "$ENV_FILE"
    else
      echo "GOOGLE_API_KEY=$INPUT_KEY" >> "$ENV_FILE"
    fi
    echo -e "${GREEN}✔ Saved GOOGLE_API_KEY to .env.${NC}"
  fi
fi

# --------------------------------------------------
# STEP 4 · Live Container Logs (App Services Only)
# --------------------------------------------------
print_banner "STEP 4 · Live Container Logs"
echo -e "Web: ${CYAN}http://localhost:5173${NC} | API: ${CYAN}http://localhost:3000${NC} | FreeLLM: ${CYAN}http://localhost:3001${NC}"
echo "Press Ctrl+C to stop log streaming (containers keep running)."
echo -e "${DIM}────────────────────────────────────────────────────────────${NC}\n"

trap 'echo -e "\n${YELLOW}Stopped log streaming. Containers are still running.${NC}"; exit 0' INT

$DOCKER_CMD compose logs -f --tail=30 pearson-freellmapi pearson-agent pearson-api pearson-web