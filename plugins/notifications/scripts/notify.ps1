#Requires -Version 5.1
<#
.SYNOPSIS
    Pushover notification script for Claude Code hooks.
.DESCRIPTION
    Reads notification data from stdin (JSON) and sends Pushover notifications
    when workstation is locked. Falls back to -AltMessage parameter for events
    that don't provide stdin data (like Stop).
.PARAMETER AltMessage
    Fallback message when stdin doesn't contain a message (e.g., Stop event).
.PARAMETER AltTitle
    Fallback title when notification_type is not available from stdin.
#>
param(
    [string]$AltMessage,
    [string]$AltTitle = "Claude Code"
)

# Read JSON from stdin
$jsonInput = ""
try {
    $jsonInput = [Console]::In.ReadToEnd()
} catch {
    # stdin not available
}

# Parse notification data
$notificationType = $null
$message = $null

if ($jsonInput) {
    try {
        $data = $jsonInput | ConvertFrom-Json
        $notificationType = $data.notification_type
        $message = $data.message
    } catch {
        # JSON parse failed
    }
}

# Use AltMessage as fallback
if (-not $message) {
    $message = $AltMessage
}

# Exit if still no message
if (-not $message) { exit 0 }

# Determine title and priority based on notification type
$title = $AltTitle
$priority = 0

switch ($notificationType) {
    "permission_prompt" {
        $title = "Claude - Permission Required"
        $priority = 1
    }
    "elicitation_dialog" {
        $title = "Claude - Input Required"
        $priority = 0
    }
    "idle_prompt" {
        $title = "Claude - Waiting"
        $priority = 0
    }
    # default: uses $AltTitle
}

# Check if workstation is locked
$locked = (Get-Process -Name LogonUI -ErrorAction SilentlyContinue) -ne $null

if (-not $locked) { exit 0 }

# Get credentials from environment
$user = $env:PUSHOVER_USER
$token = $env:PUSHOVER_TOKEN

# Exit if credentials missing
if (-not $user -or -not $token) { exit 0 }

# Send Pushover notification
try {
    $body = @{
        token    = $token
        user     = $user
        message  = $message
        title    = $title
        priority = $priority
    }
    Invoke-RestMethod -Uri "https://api.pushover.net/1/messages.json" -Method Post -Body $body -ErrorAction Stop | Out-Null
} catch {
    # Silently ignore errors
}
