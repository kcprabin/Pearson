#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:3000}"
AGENT_URL="${AGENT_URL:-http://127.0.0.1:8000}"
TIMEOUT_SECONDS="${PAIRING_TIMEOUT_SECONDS:-180}"
POLL_SECONDS=2
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
api_pid=""
agent_pid=""

command -v curl >/dev/null 2>&1 || {
  echo "curl is required."
  exit 1
}
command -v jq >/dev/null 2>&1 || {
  echo "jq is required. Install jq before running this script."
  exit 1
}

cleanup() {
  if [[ -n "$api_pid" ]] && kill -0 "$api_pid" 2>/dev/null; then
    kill "$api_pid" 2>/dev/null || true
  fi
  if [[ -n "$agent_pid" ]] && kill -0 "$agent_pid" 2>/dev/null; then
    kill "$agent_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if ! curl --fail --silent --show-error "$AGENT_URL/health" >/dev/null 2>&1; then
  echo "Python agent is not running. Starting it now..."
  (
    cd "$PROJECT_ROOT"
    exec pnpm dev:agent
  ) &
  agent_pid=$!

  echo "Waiting for Python agent..."
  agent_start_time="$(date +%s)"
  while ! curl --fail --silent "$AGENT_URL/health" >/dev/null 2>&1; do
    if ! kill -0 "$agent_pid" 2>/dev/null; then
      echo "Python agent stopped before becoming ready."
      exit 1
    fi
    if (( $(date +%s) - agent_start_time >= 60 )); then
      echo "Timed out waiting for Python agent at $AGENT_URL."
      exit 1
    fi
    sleep 1
  done
fi

echo "Python agent is ready."

if ! curl --fail --silent --show-error "$API_URL/health" >/dev/null 2>&1; then
  echo "NestJS API is not running. Starting it now..."
  (
    cd "$PROJECT_ROOT"
    exec pnpm --filter api start:dev
  ) &
  api_pid=$!

  echo "Waiting for NestJS API. Its logs and QR codes will appear below."
  api_start_time="$(date +%s)"
  while ! curl --fail --silent "$API_URL/health" >/dev/null 2>&1; do
    if ! kill -0 "$api_pid" 2>/dev/null; then
      echo "NestJS API stopped before becoming ready."
      exit 1
    fi
    if (( $(date +%s) - api_start_time >= 60 )); then
      echo "Timed out waiting for NestJS API at $API_URL."
      exit 1
    fi
    sleep 1
  done
fi

echo "NestJS API is ready. Scan both WhatsApp QR codes shown in the API output."
echo "Waiting for receiver and bot WhatsApp pairing to finish..."
start_time="$(date +%s)"

while true; do
  status="$(curl --fail-with-body -sS "$API_URL/whatsapp/status")"
  receiver_connection="$(printf '%s' "$status" | jq -r '.receiver.connection // "closed"')"
  bot_connection="$(printf '%s' "$status" | jq -r '.bot.connection // "closed"')"

  if [[ "$receiver_connection" == "open" && "$bot_connection" == "open" ]]; then
    echo "Both WhatsApp sessions are connected."
    echo "Now enter the first-login credentials."
    break
  fi

  now="$(date +%s)"
  if (( now - start_time >= TIMEOUT_SECONDS )); then
    echo "Timed out waiting for WhatsApp pairing."
    printf '%s\n' "$status"
    exit 1
  fi

  printf '  receiver=%s bot=%s\n' "$receiver_connection" "$bot_connection"
  sleep "$POLL_SECONDS"
done

read -r -p "First login - restaurant name: " restaurant_name
read -r -p "First login - owner name: " owner_name
read -r -p "First login - phone number: " phone_number

if [[ -z "$restaurant_name" || -z "$owner_name" || -z "$phone_number" ]]; then
  echo "Restaurant name, owner name, and phone number are required."
  exit 1
fi

payload="$(jq -n \
  --arg restaurantName "$restaurant_name" \
  --arg ownerName "$owner_name" \
  --arg phoneNumber "$phone_number" \
  '{restaurantName: $restaurantName, ownerName: $ownerName, phoneNumber: ($phoneNumber | tonumber)}')"

echo "POST $API_URL/hotel/first-login"
response="$(curl --fail-with-body -sS -X POST "$API_URL/hotel/first-login" \
  -H 'Content-Type: application/json' \
  -d "$payload")"
printf '%s\n' "$response"
printf 'First login completed.\n'
printf 'Services are running. Press Ctrl+C to stop them.\n'

while true; do
  sleep 3600
done
