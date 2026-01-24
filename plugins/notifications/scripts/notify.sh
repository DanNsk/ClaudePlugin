#!/bin/bash
#
# Pushover notification script for Claude Code hooks.
# Reads notification data from stdin (JSON) and sends Pushover notifications
# when workstation is locked.
#
# Arguments:
#   $1 - Fallback message when stdin doesn't contain a message
#   $2 - Fallback title (default: "Claude Code")
#

ALT_MESSAGE="${1:-}"
ALT_TITLE="${2:-Claude Code}"

# Read JSON from stdin
JSON_INPUT=$(cat 2>/dev/null || echo "")

# Dump stdio to file if DUMP_STDIO_FILE is set
if [ -n "$DUMP_STDIO_FILE" ]; then
    echo "$JSON_INPUT" >> "$DUMP_STDIO_FILE" 2>/dev/null || true
fi

# Parse notification data using jq (if available) or grep fallback
NOTIFICATION_TYPE=""
MESSAGE=""

if [ -n "$JSON_INPUT" ]; then
    if command -v jq &>/dev/null; then
        NOTIFICATION_TYPE=$(echo "$JSON_INPUT" | jq -r '.notification_type // empty' 2>/dev/null)
        MESSAGE=$(echo "$JSON_INPUT" | jq -r '.message // empty' 2>/dev/null)
    else
        # Fallback: basic grep extraction (less reliable)
        NOTIFICATION_TYPE=$(echo "$JSON_INPUT" | grep -oP '"notification_type"\s*:\s*"\K[^"]+' 2>/dev/null || echo "")
        MESSAGE=$(echo "$JSON_INPUT" | grep -oP '"message"\s*:\s*"\K[^"]+' 2>/dev/null || echo "")
    fi
fi

# Use fallback message if none from JSON
[ -z "$MESSAGE" ] && MESSAGE="$ALT_MESSAGE"

# Exit if still no message
[ -z "$MESSAGE" ] && exit 0

# Determine title and priority based on notification type
TITLE="$ALT_TITLE"
PRIORITY=0

case "$NOTIFICATION_TYPE" in
    "permission_prompt")
        TITLE="Claude - Permission Required"
        PRIORITY=1
        ;;
    "elicitation_dialog")
        TITLE="Claude - Input Required"
        PRIORITY=0
        ;;
    "idle_prompt")
        TITLE="Claude - Waiting"
        PRIORITY=0
        ;;
esac

# Check if workstation is locked (Windows via tasklist)
if ! tasklist.exe 2>/dev/null | grep -qi "LogonUI"; then
    exit 0
fi

# Get credentials from environment
[ -z "$PUSHOVER_USER" ] || [ -z "$PUSHOVER_TOKEN" ] && exit 0

# Send Pushover notification
curl -s -X POST "https://api.pushover.net/1/messages.json" \
    -d "token=$PUSHOVER_TOKEN" \
    -d "user=$PUSHOVER_USER" \
    -d "title=$TITLE" \
    -d "message=$MESSAGE" \
    -d "priority=$PRIORITY" \
    >/dev/null 2>&1

exit 0
