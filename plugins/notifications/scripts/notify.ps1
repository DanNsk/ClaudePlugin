param(
    [string]$Title = "Claude Code",
    [string]$Message = "Notification",
    [ValidateSet("Info", "Warning", "Success", "Error")]
    [string]$Type = "Info"
)

function Show-BurntToastNotification {
    param($Title, $Message, $Type)

    $sound = switch ($Type) {
        "Warning" { "Alarm" }
        "Error"   { "Alarm2" }
        "Success" { "Mail" }
        default   { "Default" }
    }

    New-BurntToastNotification -Text $Title, $Message -Sound $sound
    return $true
}

function Show-WindowsToastNotification {
    param($Title, $Message, $Type)

    try {
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

        $template = @"
<toast>
    <visual>
        <binding template="ToastText02">
            <text id="1">$Title</text>
            <text id="2">$Message</text>
        </binding>
    </visual>
    <audio src="ms-winsoundevent:Notification.Default"/>
</toast>
"@

        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)

        $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
        $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Code")
        $notifier.Show($toast)
        return $true
    }
    catch {
        return $false
    }
}

function Show-FallbackNotification {
    param($Title, $Message, $Type)

    # Console beep pattern based on type
    $beepCount = switch ($Type) {
        "Warning" { 2 }
        "Error"   { 3 }
        "Success" { 1 }
        default   { 1 }
    }

    for ($i = 0; $i -lt $beepCount; $i++) {
        [Console]::Beep(800, 200)
        if ($i -lt ($beepCount - 1)) {
            Start-Sleep -Milliseconds 100
        }
    }

    Write-Host "[$Type] $Title : $Message"
}

# Try BurntToast first (best experience)
if (Get-Module -ListAvailable -Name BurntToast) {
    Import-Module BurntToast -ErrorAction SilentlyContinue
    if (Show-BurntToastNotification -Title $Title -Message $Message -Type $Type) {
        exit 0
    }
}

# Try Windows.UI.Notifications API
if (Show-WindowsToastNotification -Title $Title -Message $Message -Type $Type) {
    exit 0
}

# Fallback to console beep + message
Show-FallbackNotification -Title $Title -Message $Message -Type $Type
