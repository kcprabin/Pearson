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

# ─── STEP 2 · Cached Build & Launch ───────────────────────────────────────────
step "STEP 2 · Starting All Containers"
HASH_FILE="$PROJECT_ROOT/.pearson-build.hash"
CUR_HASH=$(find "$PROJECT_ROOT" -maxdepth 6 \
  \( -name "Dockerfile*" -o -name "*compose*.yml" -o -name "pnpm-lock.yaml" -o -name "package.json" \
     -o -name "uv.lock" -o -name "pyproject.toml" -o -name "*.ts" -o -name "*.tsx" -o -name "*.py" \) \
  -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" -not -path "*/.venv/*" -print0 2>/dev/null \
  | sort -z | xargs -0 sha256sum 2>/dev/null | sha256sum | awk '{print $1}')

NEED_BUILD=false
[[ "${1:-}" == "--build" || "${1:-}" == "-b" || ! -f "$HASH_FILE" || "$(cat "$HASH_FILE")" != "$CUR_HASH" ]] && NEED_BUILD=true
for img in pearson-agent pearson-api pearson-web; do
  $DOCKER image inspect "$img:latest" &>/dev/null || NEED_BUILD=true
done

if [[ "$NEED_BUILD" == "true" ]]; then
  echo -e "${YELLOW}Building images (changes detected) and starting containers...${NC}"
  $DC up -d --build && echo "$CUR_HASH" > "$HASH_FILE"
else
  echo -e "${GREEN}⚡ Cache hit — starting containers without rebuilding (--build to force)...${NC}"
  $DC up -d --no-build
fi
echo -e "${GREEN}✔ All containers launched.${NC}"

# ─── STEP 3 · Health Check ────────────────────────────────────────────────────
step "STEP 3 · Health Check — Waiting for Containers"
MAX_WAIT=120; INTERVAL=3

for C in pearson-postgres pearson-redis pearson-mongo pearson-kafka; do
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

for C in pearson-freellmapi pearson-agent pearson-api pearson-web; do
  ST=$($DOCKER inspect --format='{{.State.Status}}' "$C" 2>/dev/null || echo "missing")
  printf "  %-25s " "$C"
  [[ "$ST" == "running" ]] && echo -e "${GREEN}✔ running${NC}" || { echo -e "${RED}✖ $ST${NC}"; $DOCKER logs --tail=30 "$C" 2>&1 || true; die "'$C' not running."; }
done
echo -e "\n${GREEN}✔ All containers are up and healthy!${NC}"

# ─── STEP 4 · FreeLLM API Key & .env Setup ────────────────────────────────────
step "STEP 4 · FreeLLM API Key & .env Setup"
ENV_FILE="$PROJECT_ROOT/.env"
EXISTING_KEY=$([[ -f "$ENV_FILE" ]] && grep -E '^GOOGLE_API_KEY=.+' "$ENV_FILE" | cut -d'=' -f2- | tr -d '[:space:]' || true)

if [[ -n "$EXISTING_KEY" ]]; then
  echo -e "${GREEN}✔ GOOGLE_API_KEY already set in .env — skipping setup.${NC}"
else
  echo -e "${YELLOW}Streaming ${BOLD}pearson-freellmapi${NC}${YELLOW} logs — copy your key, then press ${BOLD}ENTER${NC}${YELLOW}...${NC}\n"
  $DOCKER logs -f pearson-freellmapi &
  LOG_PID=$!; read -rp "" _; kill "$LOG_PID" 2>/dev/null || true; wait "$LOG_PID" 2>/dev/null || true

  read -rp "$(echo -e "\n${BOLD}Enter your GOOGLE_API_KEY: ${NC}")" USER_KEY
  [[ -z "$USER_KEY" ]] && die "No API key entered."

  cat > "$ENV_FILE" <<EOF
PORT=3000
POSTGRES_USER=pearson
POSTGRES_PASSWORD=pearson_dev_password
POSTGRES_DB=pearson
DATABASE_URL=postgresql://pearson:pearson_dev_password@localhost:5432/pearson
MONGO_INITDB_ROOT_USERNAME=pearson
MONGO_INITDB_ROOT_PASSWORD=pearson_mongo_dev_password
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
AGENT_URL=http://pearson-agent:8000
PINECONE_API_KEY=pcsk_6cK5WE_7kg7eYkhAG15LLCGJ7G6bjkug69peSVV6Tr3MccXP5Q9YfuwHD22EWVi29HLQGw
GOOGLE_API_KEY=$USER_KEY
EOF
  echo -e "${GREEN}✔ .env written — recreating agent & api...${NC}"
  $DC up -d --force-recreate agent api
fi

# ─── STEP 5 · Restaurant First Login ──────────────────────────────────────────
step "STEP 5 · Restaurant First Login"
echo -e "${YELLOW}Waiting for WhatsApp pairing...${NC}"
WAIT=0
until $DOCKER logs pearson-api 2>&1 | grep -q "Connected to WhatsApp as bot."; do
  [[ "$WAIT" -ge "$MAX_WAIT" ]] && die "Timed out waiting for WhatsApp pairing. Scan QR and re-run."
  sleep "$INTERVAL"; WAIT=$((WAIT + INTERVAL))
done
echo -e "${GREEN}✔ WhatsApp pairing completed.${NC}\n"

read -rp "Restaurant phone number (10-15 digits): " R_PHONE
[[ "$R_PHONE" =~ ^[0-9]{10,15}$ ]] || die "Phone number must be 10 to 15 digits."

EXISTS=$(curl -fsS -X POST "http://localhost:3000/hotel/checkuser" -H "Content-Type: application/json" \
  -d "{\"phoneNumber\":\"$R_PHONE\"}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(!!JSON.parse(s).exists)}catch{console.log(false)}})') || die "Failed /hotel/checkuser."

if [[ "$EXISTS" == "true" ]]; then
  echo -e "${YELLOW}✔ Restaurant already registered for $R_PHONE — skipping onboarding.${NC}"
  LAST_CREDS=$($DOCKER logs pearson-api 2>&1 | grep -oE 'username=[^,]+, password=[^[:space:]]+' | tail -n 1 || true)
  [[ -n "$LAST_CREDS" ]] && echo -e "${CYAN}  Last logged credentials: ${BOLD}$LAST_CREDS${NC}"
else
  read -rp "Restaurant name: " R_NAME
  read -rp "Owner name: " O_NAME
  read -rp "Owner phone number (optional): " O_PHONE
  read -rp "Restaurant address (optional): " R_ADDR
  read -rp "Restaurant email (optional): " R_EMAIL
  read -rp "Owner email (optional): " O_EMAIL
  [[ -z "$R_NAME" || -z "$O_NAME" ]] && die "Restaurant name and owner name are required."

  PAYLOAD=$(R_NAME="$R_NAME" O_NAME="$O_NAME" R_PHONE="$R_PHONE" O_PHONE="$O_PHONE" R_ADDR="$R_ADDR" R_EMAIL="$R_EMAIL" O_EMAIL="$O_EMAIL" node -e '
    const p = { restaurantName: process.env.R_NAME, ownerName: process.env.O_NAME, phoneNumber: process.env.R_PHONE };
    for (const [k, v] of Object.entries({ ownerPhoneNumber: process.env.O_PHONE, address: process.env.R_ADDR, email: process.env.R_EMAIL, ownerEmail: process.env.O_EMAIL })) if (v) p[k] = v;
    process.stdout.write(JSON.stringify(p));')

  RESP=$(curl -fsS -X POST "http://localhost:3000/hotel/first-login" -H "Content-Type: application/json" -d "$PAYLOAD") || die "Failed /hotel/first-login."

  CREDS=$(printf '%s' "$RESP" | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      try {
        const r = JSON.parse(s);
        const d = r.data?.data ?? r.data ?? {};
        if (d.username || d.password) console.log(`username=${d.username}, password=${d.password} (Thread ID: ${r.convo_Id ?? "N/A"})`);
      } catch {}
    });')
  [[ -z "$CREDS" ]] && CREDS=$($DOCKER logs pearson-api 2>&1 | grep -oE 'username=[^,]+, password=[^[:space:]]+' | tail -n 1 || true)

  echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  🔑  RESTAURANT LOGIN CREDENTIALS                         ║${NC}"
  echo -e "${GREEN}║  ${BOLD}${CREDS:-Check pearson-api logs below}${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
fi

# ─── STEP 6 · Live Container Logs ─────────────────────────────────────────────
step "STEP 6 · Live Container Logs"
echo -e "Web: ${CYAN}http://localhost:5173${NC} | API: ${CYAN}http://localhost:3000${NC} | FreeLLM: ${CYAN}http://localhost:3001${NC}"
echo -e "${CYAN}Press Ctrl+C to exit log stream (containers stay running).${NC}\n"
trap 'echo -e "\n${YELLOW}Stopped log stream. Stop containers with: $DC down${NC}"' EXIT SIGINT SIGTERM

$DC logs -f --tail=100 pearson-freellmapi pearson-agent pearson-api pearson-web | while IFS= read -r line; do
  echo -e "$line"
  low="${line,,}"
  if [[ "$low" =~ "qr ready" ]]; then
    role="WHATSAPP"; col="$GREEN"
    [[ "$low" =~ "receiver" ]] && { role="RECEIVER"; col="$CYAN"; }
    [[ "$low" =~ "bot" ]] && role="BOT"
    echo -e "\n${col}╔═══════════════════════════════════════════════════════════╗\n║  🔲  ${role} QR CODE IS COMING — scan in WhatsApp        ║\n╚═══════════════════════════════════════════════════════════╝${NC}\n"
  elif [[ "$line" =~ Generated\ restaurant\ login\ credentials:\ (.+) ]]; then
    echo -e "\n${YELLOW}╔═══════════════════════════════════════════════════════════╗\n║  🔑  CREDENTIALS: ${BOLD}${BASH_REMATCH[1]}${NC}${YELLOW}\n╚═══════════════════════════════════════════════════════════╝${NC}\n"
  fi
done