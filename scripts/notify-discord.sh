#!/usr/bin/env bash
#
# Posts a message to the Discord webhook, if one is configured.
#
# Silently does nothing when DISCORD_WEBHOOK_URL is unset, so alerting is
# genuinely optional — a fork or a fresh clone should not fail a workflow just
# because the maintainer has not wired up a webhook.
#
# Usage: scripts/notify-discord.sh "message text"

set -euo pipefail

message="${1:?usage: notify-discord.sh <message>}"

if [[ -z "${DISCORD_WEBHOOK_URL:-}" ]]; then
  echo "No DISCORD_WEBHOOK_URL configured; skipping notification."
  exit 0
fi

# jq builds the JSON so quotes and newlines in the message cannot break it.
payload="$(jq -n --arg content "$message" '{content: $content}')"

curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -d "$payload" \
  "$DISCORD_WEBHOOK_URL" >/dev/null

echo "Discord notified."
