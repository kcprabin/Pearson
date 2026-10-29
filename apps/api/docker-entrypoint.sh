#!/bin/sh
set -e

echo "========================================================"
echo " Starting Pearson API Service                           "
echo " Checking database readiness and applying migrations... "
echo "========================================================"

MAX_RETRIES=20
COUNT=0

until (cd /app/packages/database && pnpm run db:migrate) || [ $COUNT -eq $MAX_RETRIES ]; do
  COUNT=$((COUNT + 1))
  echo "[Database Migration] Attempt $COUNT/$MAX_RETRIES failed (waiting 2s for Postgres to accept connections)..."
  sleep 2
done

if [ $COUNT -eq $MAX_RETRIES ]; then
  echo "[Database Migration] WARNING: Migrations did not complete in time. Attempting to start API anyway..."
else
  echo "[Database Migration] Migrations applied successfully!"
fi

echo "Launching API process..."
cd /app/apps/api
exec "$@"
