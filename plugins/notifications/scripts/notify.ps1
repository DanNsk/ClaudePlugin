#Requires -Version 5.1
param(
    [string]$Message = "Claude stopped execution",
    [string]$Title = "Claude Alert",
    [ValidateSet("Info", "Warning", "Success", "Error")]
    [string]$Type = "Info"
)

# Check if workstation is locked
$locked = (Get-Process -Name LogonUI -ErrorAction SilentlyContinue) -ne $null

if (-not $locked) { exit 0 }

# Get credentials from environment
$user = $env:PUSHOVER_USER
$token = $env:PUSHOVER_TOKEN

# Exit if credentials missing
if (-not $user -or -not $token) { exit 0 }

# Map type to priority (-1 = low, 0 = normal, 1 = high)
$priority = switch ($Type) {
    "Warning" { 1 }
    "Error"   { 1 }
    "Success" { 0 }
    default   { 0 }
}

# Send Pushover notification
try {
    $body = @{
        token    = $token
        user     = $user
        message  = $Message
        title    = $Title
        priority = $priority
    }
    Invoke-RestMethod -Uri "https://api.pushover.net/1/messages.json" -Method Post -Body $body -ErrorAction Stop | Out-Null
}
catch {
    # Silently ignore errors
}
