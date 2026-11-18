#!/usr/bin/env bash

set -e

# ─── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Helpers ──────────────────────────────────────────────────────────────────
command_exists() { command -v "$1" &> /dev/null; }

print_banner() {
    echo ""
    echo -e "${BOLD}${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║       Pearson AI System — Startup Script                  ║${NC}"
    echo -e "${BOLD}${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════${NC}"
}

# ─── Resolve docker command ───────────────────────────────────────────────────
get_docker_cmd() {
    if docker info &> /dev/null 2>&1; then
        echo "docker"
    else
        echo "sudo docker"
    fi
}

print_banner

# ═══════════════════════════════════════════════════════════════════════════════
print_step "STEP 1 · Checking Prerequisites"
# ═══════════════════════════════════════════════════════════════════════════════

if ! command_exists docker; then
    echo -e "${RED}✖ Docker is not installed. Please install Docker and try again.${NC}"
    exit 1
fi

DOCKER_CMD=$(get_docker_cmd)

if ! $DOCKER_CMD compose version &> /dev/null; then
    echo -e "${RED}✖ Docker Compose (v2) is not available. Please install it and try again.${NC}"
    exit 1
fi

DOCKER_COMPOSE="$DOCKER_CMD compose"

echo -e "${GREEN}✔ Docker & Docker Compose are ready.${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
print_step "STEP 2 · Starting All Containers"
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}Pulling/building images and starting all services in detached mode...${NC}"
echo ""

$DOCKER_COMPOSE up -d --build

echo ""
echo -e "${GREEN}✔ All containers launched.${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
print_step "STEP 3 · Health Check — Waiting for Containers"
# ═══════════════════════════════════════════════════════════════════════════════

# Services with Docker healthchecks defined
HEALTH_SERVICES=("pearson-postgres" "pearson-redis" "pearson-mongo" "pearson-kafka")
# Services that are simply expected to be running (no healthcheck)
RUNNING_SERVICES=("pearson-freellmapi" "pearson-agent" "pearson-api" "pearson-web")

MAX_WAIT=120   # seconds
INTERVAL=3

echo -e "${YELLOW}Waiting for services with healthchecks to become healthy...${NC}"
echo ""

for CONTAINER in "${HEALTH_SERVICES[@]}"; do
    ELAPSED=0
    printf "  %-25s " "$CONTAINER"
    while true; do
        STATUS=$($DOCKER_CMD inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "missing")
        if [[ "$STATUS" == "healthy" ]]; then
            echo -e "${GREEN}✔ healthy${NC}"
            break
        elif [[ "$STATUS" == "unhealthy" ]]; then
            echo -e "${RED}✖ unhealthy${NC}"
            echo ""
            echo -e "${RED}Container '$CONTAINER' is unhealthy. Logs:${NC}"
            $DOCKER_CMD logs --tail=30 "$CONTAINER"
            echo ""
            echo -e "${RED}Aborting. Fix the issue above and re-run the script.${NC}"
            exit 1
        elif [[ "$ELAPSED" -ge "$MAX_WAIT" ]]; then
            echo -e "${RED}✖ timed out (status: $STATUS)${NC}"
            echo ""
            echo -e "${RED}Logs for '$CONTAINER':${NC}"
            $DOCKER_CMD logs --tail=30 "$CONTAINER"
            exit 1
        fi
        sleep "$INTERVAL"
        ELAPSED=$((ELAPSED + INTERVAL))
        printf "."
    done
done

echo ""
echo -e "${YELLOW}Verifying remaining services are running...${NC}"
echo ""

for CONTAINER in "${RUNNING_SERVICES[@]}"; do
    STATUS=$($DOCKER_CMD inspect --format='{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "missing")
    printf "  %-25s " "$CONTAINER"
    if [[ "$STATUS" == "running" ]]; then
        echo -e "${GREEN}✔ running${NC}"
    else
        echo -e "${RED}✖ $STATUS${NC}"
        echo ""
        echo -e "${RED}Container '$CONTAINER' is not running. Logs:${NC}"
        $DOCKER_CMD logs --tail=30 "$CONTAINER"
        echo ""
        echo -e "${RED}Aborting. Fix the issue above and re-run the script.${NC}"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}✔ All containers are up and healthy!${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
print_step "STEP 4 · FreeLLM API Key Setup"
# ═══════════════════════════════════════════════════════════════════════════════

# Check if GOOGLE_API_KEY is already set in an existing .env
EXISTING_KEY=""
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    EXISTING_KEY=$(grep -E '^GOOGLE_API_KEY=.+' "$PROJECT_ROOT/.env" | cut -d'=' -f2- | tr -d '[:space:]')
fi

if [[ -n "$EXISTING_KEY" ]]; then
    echo -e "${GREEN}✔ GOOGLE_API_KEY is already set in .env — skipping key setup.${NC}"
    USER_GOOGLE_API_KEY="$EXISTING_KEY"
else
    echo -e "${YELLOW}Streaming logs from ${BOLD}pearson-freellmapi${NC}${YELLOW}...${NC}"
    echo -e "${YELLOW}Find your ${BOLD}GOOGLE_API_KEY${NC}${YELLOW} in the output below.${NC}"
    echo -e "${CYAN}Press ${BOLD}ENTER${NC}${CYAN} once you have copied the key.${NC}"
    echo ""
    echo -e "${BLUE}────────────────────── FreeLLM Logs ──────────────────────${NC}"

    # Stream freellmapi logs in background, user presses ENTER to stop
    $DOCKER_CMD logs -f pearson-freellmapi &
    FREELLM_LOG_PID=$!

    # Wait for ENTER key
    read -rp "" _

    # Stop the log stream
    kill "$FREELLM_LOG_PID" 2>/dev/null || true
    wait "$FREELLM_LOG_PID" 2>/dev/null || true

    echo ""
    echo -e "${BLUE}────────────────────── End of FreeLLM Logs ───────────────${NC}"
    echo ""

    # ═══════════════════════════════════════════════════════════════════════════════
    print_step "STEP 5 · Write Root .env File"
    # ═══════════════════════════════════════════════════════════════════════════════

    read -rp "$(echo -e "${BOLD}Enter your GOOGLE_API_KEY (from FreeLLM logs above): ${NC}")" USER_GOOGLE_API_KEY

    if [[ -z "$USER_GOOGLE_API_KEY" ]]; then
        echo -e "${RED}✖ No API key entered. Aborting.${NC}"
        exit 1
    fi

    cat > "$PROJECT_ROOT/.env" <<EOF
# Copy this file to .env before starting the local services.
# Keep real credentials in .env only; never commit that file.

# API
PORT=3000

# PostgreSQL
POSTGRES_USER=pearson
POSTGRES_PASSWORD=pearson_dev_password
POSTGRES_DB=pearson
DATABASE_URL=postgresql://pearson:pearson_dev_password@localhost:5432/pearson

# MongoDB
MONGO_INITDB_ROOT_USERNAME=pearson
MONGO_INITDB_ROOT_PASSWORD=pearson_mongo_dev_password

# Local infrastructure endpoints
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092


# Agent Service
AGENT_URL=http://localhost:8000

PINECONE_API_KEY=pcsk_6cK5WE_7kg7eYkhAG15LLCGJ7G6bjkug69peSVV6Tr3MccXP5Q9YfuwHD22EWVi29HLQGw
GOOGLE_API_KEY=$USER_GOOGLE_API_KEY
EOF

    echo ""
    echo -e "${GREEN}✔ .env written to ${BOLD}$PROJECT_ROOT/.env${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
print_step "STEP 6 · Live Container Logs"
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}Streaming live logs from ${BOLD}all containers${NC}${YELLOW}...${NC}"
echo -e "${CYAN}Press ${BOLD}Ctrl+C${NC}${CYAN} to stop log streaming and exit.${NC}"
echo ""
echo -e "${BLUE}────────────────────── All Container Logs ──────────────────${NC}"
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Exiting log stream. Containers are still running in background.${NC}"
    echo -e "${YELLOW}To stop all containers run:  docker compose down${NC}"
    echo ""
}
trap cleanup EXIT SIGINT SIGTERM

# Stream every service's logs live. QR lines are highlighted as receiver or bot.
$DOCKER_CMD compose logs -f --tail=100 | while IFS= read -r line; do
    echo -e "$line"

    lower_line="${line,,}"
    if [[ "$lower_line" =~ "qr ready" ]]; then
        if [[ "$lower_line" =~ "[receiver]" ]] || [[ "$lower_line" =~ "receiver qr" ]]; then
            qr_role="RECEIVER"
            qr_color="$CYAN"
        elif [[ "$lower_line" =~ "[bot]" ]] || [[ "$lower_line" =~ "bot qr" ]]; then
            qr_role="BOT"
            qr_color="$GREEN"
        else
            qr_role="WHATSAPP"
            qr_color="$GREEN"
        fi

        echo ""
        echo -e "${qr_color}╔═══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${qr_color}║  🔲  ${qr_role} QR CODE IS COMING — scan in WhatsApp        ║${NC}"
        echo -e "${qr_color}╚═══════════════════════════════════════════════════════════╝${NC}"
        echo ""
    fi
done
