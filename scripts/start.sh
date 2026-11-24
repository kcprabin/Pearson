#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
step() { echo -e "\n${BOLD}${CYAN}══════════════════════════════════════════════════\n  $1\n══════════════════════════════════════════════════${NC}"; }
die()  { echo -e "${RED}✖ $1${NC}"; exit 1; }

# ─── STEP 1 · Prerequisites ───────────────────────────────────────────────────
step "STEP 1 · Checking Prerequisites"
command -v docker &>/dev/null || die "Docker is not installed."
DOCKER="docker"; docker info &>/dev/null 2>&1 || DOCKER="sudo docker"
DC="$DOCKER compose"
$DC version &>/dev/null || die "Docker Compose (v2) is not available."
echo -e "${GREEN}✔ Docker & Docker Compose ready.${NC}"

# External volumes keep WhatsApp receiver and bot sessions across `docker compose down -v`.
for volume in pearson_postgres_data pearson_baileys_receiver_auth pearson_baileys_bot_auth; do
  if ! $DOCKER volume inspect "$volume" &>/dev/null; then
    $DOCKER volume create "$volume" >/dev/null
    echo -e "${GREEN}✔ Created persistent volume: $volume${NC}"
  fi
done

# ─── STEP 2 · Smart Build & Launch ────────────────────────────────────────────
step "STEP 2 · Starting All Containers"
NEED_BUILD=false
BUILD_REASON=""

# Flag: explicit --build / -b argument
if [[ "${1:-}" == "--build" || "${1:-}" == "-b" ]]; then
  NEED_BUILD=true
  BUILD_REASON="--build flag passed"
fi

# Flag: any image missing
for img in pearson-agent pearson-api pearson-web; do
  if ! $DOCKER image inspect "$img:latest" &>/dev/null; then
    NEED_BUILD=true
    BUILD_REASON="image '$img' not found"
    break
  fi
done

# Flag: code changes detected via git (modified/untracked files in source dirs)
if [[ "$NEED_BUILD" == "false" ]] && command -v git &>/dev/null && git -C "$PROJECT_ROOT" rev-parse --git-dir &>/dev/null; then
  CHANGED=$(git -C "$PROJECT_ROOT" status --short -- \
    services/ apps/ packages/ Dockerfile "*/Dockerfile" \
    docker-compose.yml docker-compose.yaml \
    "*/requirements*.txt" "*/package.json" "*/pyproject.toml" \
    2>/dev/null | head -1 || true)
  if [[ -n "$CHANGED" ]]; then
    NEED_BUILD=true
    BUILD_REASON="uncommitted source changes detected (run 'git status' to review)"
  fi

  # Also rebuild if there are commits newer than the youngest image (portable ISO-8601 comparison)
  if [[ "$NEED_BUILD" == "false" ]]; then
    YOUNGEST_IMAGE_ISO=""
    for img in pearson-agent pearson-api pearson-web; do
      TS=$($DOCKER inspect --format='{{.Created}}' "$img:latest" 2>/dev/null || true)
      if [[ -n "$TS" && ( -z "$YOUNGEST_IMAGE_ISO" || "$TS" > "$YOUNGEST_IMAGE_ISO" ) ]]; then
        YOUNGEST_IMAGE_ISO="$TS"
      fi
    done
    LAST_COMMIT_ISO=$(git -C "$PROJECT_ROOT" log -1 --format=%cI -- \
      services/ apps/ packages/ docker-compose.yml "*/Dockerfile" 2>/dev/null || true)
    if [[ -n "$LAST_COMMIT_ISO" && -n "$YOUNGEST_IMAGE_ISO" && "$LAST_COMMIT_ISO" > "$YOUNGEST_IMAGE_ISO" ]]; then
      NEED_BUILD=true
      BUILD_REASON="new commits since last image build"
    fi
  fi
fi

if [[ "$NEED_BUILD" == "true" ]]; then
  echo -e "${YELLOW}⚙ Building images (reason: ${BUILD_REASON}) and starting containers...${NC}"
  $DC up -d --build
else
  echo -e "${GREEN}⚡ No changes detected — starting with cached images (pass --build to force rebuild)...${NC}"
  $DC up -d --no-build
fi
echo -e "${GREEN}✔ All containers launched.${NC}"

# ─── STEP 3 · Health Check ────────────────────────────────────────────────────
step "STEP 3 · Health Check — Waiting for Containers"
MAX_WAIT=120; INTERVAL=3

for C in pearson-postgres pearson-kafka; do
  ELAPSED=0; printf "  %-25s " "$C"
  while true; do
    ST=$($DOCKER inspect --format='{{.State.Health.Status}}' "$C" 2>/dev/null || echo "missing")
    [[ "$ST" == "healthy" ]] && { echo -e "${GREEN}✔ healthy${NC}"; break; }
    if [[ "$ST" == "unhealthy" || "$ELAPSED" -ge "$MAX_WAIT" ]]; then
      echo -e "${RED}✖ $ST${NC}"; $DOCKER logs --tail=30 "$C" 2>&1 || true; die "Container '$C' failed healthcheck."
    fi
    sleep "$INTERVAL"; ELAPSED=$((ELAPSED + INTERVAL)); printf "."
  done
done

for C in pearson-agent pearson-api pearson-web; do
  ST=$($DOCKER inspect --format='{{.State.Status}}' "$C" 2>/dev/null || echo "missing")
  printf "  %-25s " "$C"
  [[ "$ST" == "running" ]] && echo -e "${GREEN}✔ running${NC}" || { echo -e "${RED}✖ $ST${NC}"; $DOCKER logs --tail=30 "$C" 2>&1 || true; die "'$C' not running."; }
done
echo -e "\n${GREEN}✔ All containers are up and healthy!${NC}"

# ─── STEP 4 · Gemini API Key & .env Setup ─────────────────────────────────────
step "STEP 4 · Gemini API Key & .env Setup"
ENV_FILE="$PROJECT_ROOT/.env"
EXISTING_KEY=$([[ -f "$ENV_FILE" ]] && grep -E '^GOOGLE_API_KEY=.+' "$ENV_FILE" | cut -d'=' -f2- | tr -d '[:space:]' || true)

if [[ -n "$EXISTING_KEY" ]]; then
  echo -e "${GREEN}✔ GOOGLE_API_KEY already set in .env — skipping setup.${NC}"
else
  read -rp "$(echo -e "${BOLD}Enter your GOOGLE_API_KEY: ${NC}")" USER_KEY
  [[ -z "$USER_KEY" ]] && die "No API key entered."

  cat > "$ENV_FILE" <<EOF
PORT=3000
POSTGRES_USER=pearson
POSTGRES_PASSWORD=pearson_dev_password
POSTGRES_DB=pearson
DATABASE_URL=postgresql://pearson:pearson_dev_password@localhost:5432/pearson
KAFKA_BROKERS=localhost:9092
AGENT_URL=http://agent:8000
PINECONE_API_KEY=REPLACE_WITH_YOUR_PINECONE_KEY
GOOGLE_API_KEY=$USER_KEY
EOF
  echo -e "${GREEN}✔ .env written — recreating agent & api...${NC}"
  $DC up -d --force-recreate agent api
  sleep 3
fi

# ─── STEP 4.5 · Database Migration ────────────────────────────────────────────
step "STEP 4.5 · Running Database Migrations"
$DOCKER exec pearson-api sh -c 'cd /app/packages/database && pnpm run db:migrate' || die "Database migration (pnpm run db:migrate) failed."
echo -e "${GREEN}✔ Database migrations applied successfully.${NC}"

# ─── STEP 5 · WhatsApp Pairing & Restaurant First Login ───────────────────────
step "STEP 5 · WhatsApp Pairing & Restaurant First Login"

if $DOCKER logs --tail=300 pearson-api 2>&1 | grep -q "Connected to WhatsApp as bot."; then
  echo -e "${GREEN}✔ WhatsApp already connected (receiver & bot).${NC}\n"
else
  echo -e "${YELLOW}Waiting for WhatsApp connection — if unpaired, QR codes will appear below:${NC}\n"

  (
    $DOCKER logs -f --tail=50 pearson-api 2>&1 | while IFS= read -r line; do
      echo -e "$line"
      low="${line,,}"
      if [[ "$low" =~ "qr ready" ]]; then
        role="WHATSAPP"; col="$GREEN"
        [[ "$low" =~ "receiver" ]] && { role="RECEIVER"; col="$CYAN"; }
        [[ "$low" =~ "bot" ]] && role="BOT"
        echo -e "\n${col}╔═══════════════════════════════════════════════════════════╗\n║  🔲  SCAN ${role} QR CODE ABOVE IN WHATSAPP               ║\n╚═══════════════════════════════════════════════════════════╝${NC}\n"
      fi
    done
  ) &
  PAIR_LOG_PID=$!
  trap 'kill "$PAIR_LOG_PID" 2>/dev/null || true' EXIT

  WAIT=0
  PAIR_TIMEOUT=180
  until $DOCKER logs --tail=300 pearson-api 2>&1 | grep -q "Connected to WhatsApp as bot."; do
    if [[ "$WAIT" -ge "$PAIR_TIMEOUT" ]]; then
      kill "$PAIR_LOG_PID" 2>/dev/null || true
      wait "$PAIR_LOG_PID" 2>/dev/null || true
      die "Timed out waiting for WhatsApp pairing. Re-run ./scripts/start.sh to scan QR."
    fi
    sleep "$INTERVAL"
    WAIT=$((WAIT + INTERVAL))
  done

  kill "$PAIR_LOG_PID" 2>/dev/null || true
  wait "$PAIR_LOG_PID" 2>/dev/null || true
  trap - EXIT
  echo -e "\n${GREEN}✔ Both Receiver and Bot WhatsApp sessions are connected!${NC}\n"
fi

read -rp "Restaurant phone number (10-15 digits): " R_PHONE
[[ "$R_PHONE" =~ ^[0-9]{10,15}$ ]] || die "Phone number must be 10 to 15 digits."

EXISTS=$(curl -fsS -X POST "http://localhost:3000/hotel/checkuser" -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"$R_PHONE\"}" | $DOCKER exec -i pearson-api node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(!!JSON.parse(s).exists)}catch{console.log(false)}})') || die "Failed /hotel/checkuser."

if [[ "$EXISTS" == "true" ]]; then
  echo -e "${YELLOW}✔ Restaurant already registered for $R_PHONE — skipping onboarding.${NC}"
  LAST_CREDS=$($DOCKER logs --tail=500 pearson-api 2>&1 | grep -oE 'username=[^,]+, password=[^[:space:]]+' | tail -n 1 || true)
  [[ -n "$LAST_CREDS" ]] && echo -e "${CYAN}  Last logged credentials: ${BOLD}$LAST_CREDS${NC}"
else
  read -rp "Restaurant name: " R_NAME
  read -rp "Owner name: " O_NAME
  read -rp "Owner phone number (optional): " O_PHONE
  read -rp "Restaurant address (optional): " R_ADDR
  read -rp "Restaurant email (optional): " R_EMAIL
  read -rp "Owner email (optional): " O_EMAIL
  [[ -z "$R_NAME" || -z "$O_NAME" ]] && die "Restaurant name and owner name are required."

  PAYLOAD=$(R_NAME="$R_NAME" O_NAME="$O_NAME" R_PHONE="$R_PHONE" O_PHONE="$O_PHONE" R_ADDR="$R_ADDR" R_EMAIL="$R_EMAIL" O_EMAIL="$O_EMAIL" $DOCKER exec -i -e R_NAME -e O_NAME -e R_PHONE -e O_PHONE -e R_ADDR -e R_EMAIL -e O_EMAIL pearson-api node -e '
    const p = { restaurantName: process.env.R_NAME, ownerName: process.env.O_NAME, phoneNumber: process.env.R_PHONE };
    for (const [k, v] of Object.entries({ ownerPhoneNumber: process.env.O_PHONE, address: process.env.R_ADDR, email: process.env.R_EMAIL, ownerEmail: process.env.O_EMAIL })) if (v) p[k] = v;
    process.stdout.write(JSON.stringify(p));')

  RESP=$(curl -fsS -X POST "http://localhost:3000/hotel/first-login" -H "Content-Type: application/json" -d "$PAYLOAD") || die "Failed /hotel/first-login."

  CREDS=$(printf '%s' "$RESP" | $DOCKER exec -i pearson-api node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      try {
        const r = JSON.parse(s);
        const d = r.data?.data ?? r.data ?? {};
        if (d.username || d.password) console.log(`username=${d.username}, password=${d.password} (Thread ID: ${r.convo_Id ?? "N/A"})`);
      } catch {}
    });')
  [[ -z "$CREDS" ]] && CREDS=$($DOCKER logs --tail=500 pearson-api 2>&1 | grep -oE 'username=[^,]+, password=[^[:space:]]+' | tail -n 1 || true)

  echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  🔑  RESTAURANT LOGIN CREDENTIALS                         ║${NC}"
  echo -e "${GREEN}║  ${BOLD}${CREDS:-Check pearson-api logs below}${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
fi

# ─── STEP 6 · Live Container Logs (Runs Until Ctrl+C) ────────────────────────
step "STEP 6 · Live Container Logs"
echo -e "Web: ${CYAN}http://localhost:5173${NC} | API: ${CYAN}http://localhost:3000${NC} | Agent: ${CYAN}http://localhost:8000${NC}"
echo -e "${YELLOW}Running continuously — press ${BOLD}Ctrl+C${NC}${YELLOW} to shut down all containers and exit.${NC}\n"

shutdown_stack() {
  trap - INT TERM
  echo -e "\n\n${YELLOW}🛑 Ctrl+C received — stopping and removing all containers...${NC}"
  $DC down
  echo -e "${GREEN}✔ All containers stopped.${NC}"
  exit 0
}
trap shutdown_stack INT TERM

while true; do
  $DC logs -f --tail=100 agent api web 2>/dev/null | while IFS= read -r line; do
    echo -e "$line"
    low="${line,,}"
    if [[ "$low" =~ "qr ready" ]]; then
      role="WHATSAPP"; col="$GREEN"
      [[ "$low" =~ "receiver" ]] && { role="RECEIVER"; col="$CYAN"; }
      [[ "$low" =~ "bot" ]] && role="BOT"
      echo -e "\n${col}╔═══════════════════════════════════════════════════════════╗\n║  🔲  ${role} QR CODE IS COMING — scan in WhatsApp        ║\n╚═══════════════════════════════════════════════════════════╝\n"
    elif [[ "$line" =~ Generated\ restaurant\ login\ credentials:\ (.+) ]]; then
      echo -e "\n${YELLOW}╔═══════════════════════════════════════════════════════════╗\n║  🔑  CREDENTIALS: ${BOLD}${BASH_REMATCH[1]}${NC}${YELLOW}\n╚═══════════════════════════════════════════════════════════╝\n"
    fi
  done || true
  sleep 2
done