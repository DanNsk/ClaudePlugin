# /// script
# requires-python = ">=3.10"
# dependencies = ["requests"]
# ///
"""Pushover notification script for Claude Code hooks.

Reads notification data from stdin (JSON) and sends Pushover notifications
when workstation is locked.

Two invocation modes:
  stdin mode:       uv run notify.py              (hook fires, reads JSON from stdin)
  verify-stop mode: uv run notify.py --verify-stop <transcript_path> <title> <body> [--debug <log_path>]
"""

import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

import requests

log_file: Path | None = None


def write_log(message: str) -> None:
    if not log_file:
        return
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {message}\n")


def split_pascal_case(text: str) -> str:
    return re.sub(r"([a-z])([A-Z])", r"\1 \2", text)


def convert_to_past_tense(text: str) -> str:
    result = re.sub(r"\bStart\b", "Started", text)
    result = re.sub(r"\bStop\b", "Stopped", result)
    return result


def is_workstation_locked() -> bool:
    try:
        result = subprocess.run(
            ["tasklist", "/FI", "IMAGENAME eq LogonUI.exe"],
            capture_output=True,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0,
        )
        return "LogonUI.exe" in result.stdout
    except Exception:
        return False


def send_notification(title: str, body: str) -> None:
    """Check workstation lock state and send Pushover notification if locked."""
    if not is_workstation_locked():
        write_log("EXIT: Workstation not locked")
        return

    pushover_user = os.environ.get("PUSHOVER_USER")
    pushover_token = os.environ.get("PUSHOVER_TOKEN")

    if not pushover_user or not pushover_token:
        write_log("EXIT: Missing PUSHOVER_USER or PUSHOVER_TOKEN")
        return

    try:
        response = requests.post(
            "https://api.pushover.net/1/messages.json",
            data={
                "token": pushover_token,
                "user": pushover_user,
                "title": title,
                "message": body,
            },
            timeout=10,
        )
        response.raise_for_status()
        write_log("EXIT: Notification sent successfully")
    except requests.RequestException as e:
        write_log(f"EXIT: Pushover API error - {e}")


def spawn_stop_verifier(transcript_path: str, title: str, body: str) -> None:
    """Launch a detached process to verify the session actually stopped."""
    script_path = str(Path(__file__).resolve())
    cmd = ["uv", "run", script_path, "--verify-stop", transcript_path, title, body]

    if log_file:
        cmd.extend(["--debug", str(log_file)])

    if not is_workstation_locked():
        write_log("EXIT: Workstation not locked, skipping stop verifier")
        return

    write_log(f"Spawning stop verifier: {' '.join(cmd)}")

    si = subprocess.STARTUPINFO()
    si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    si.wShowWindow = subprocess.SW_HIDE

    subprocess.Popen(
        cmd,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NO_WINDOW,
        startupinfo=si,
    )


def verify_stop_mode() -> None:
    """--verify-stop entry point. Check transcript size, recurse or notify."""
    global log_file

    # Parse args: --verify-stop <transcript_path> <title> <body> [--debug <log_path>]
    args = sys.argv[2:]  # skip script name and --verify-stop
    if len(args) < 3:
        return

    transcript_path = args[0]
    title = args[1]
    body = args[2]

    if len(args) >= 5 and args[3] == "--debug":
        log_file = Path(args[4])

    write_log(f"--- Verify-stop invocation ---")
    write_log(f"Transcript: {transcript_path}")

    try:
        size_1 = os.path.getsize(transcript_path)
    except OSError:
        # File doesn't exist or inaccessible -- treat as stopped
        write_log(f"Transcript not accessible, treating as stopped")
        send_notification(title, body)
        return

    write_log(f"Size check 1: {size_1}")
    time.sleep(5)

    try:
        size_2 = os.path.getsize(transcript_path)
    except OSError:
        # File disappeared between checks -- treat as stopped
        write_log(f"Transcript disappeared, treating as stopped")
        send_notification(title, body)
        return

    write_log(f"Size check 2: {size_2}")

    if size_2 != size_1:
        write_log(f"Transcript still growing ({size_1} -> {size_2}), stop was denied. Spawning another verifier.")
        spawn_stop_verifier(transcript_path, title, body)
        return

    write_log(f"Transcript unchanged, session actually stopped.")
    send_notification(title, body)


def main() -> None:
    global log_file

    if len(sys.argv) > 1 and sys.argv[1] == "--verify-stop":
        verify_stop_mode()
        return

    json_input = sys.stdin.read()

    debug_filename = os.environ.get("NOTIFICATION_DEBUG_FILENAME")
    if debug_filename:
        try:
            temp_data = json.loads(json_input)
            if cwd := temp_data.get("cwd"):
                log_file = Path(cwd) / debug_filename
        except Exception:
            pass

    write_log("--- New invocation ---")
    write_log(f"STDIN: {json_input.strip()}")

    if not json_input:
        write_log("EXIT: No data received")
        return

    try:
        data = json.loads(json_input)
    except json.JSONDecodeError as e:
        write_log(f"EXIT: Failed to parse JSON - {e}")
        return

    if not data:
        write_log("EXIT: No data received")
        return

    hook_event_name = data.get("hook_event_name", "")
    notification_type = data.get("notification_type")
    message = data.get("message")

    hook_formatted = split_pascal_case(hook_event_name)
    hook_formatted = convert_to_past_tense(hook_formatted)

    if notification_type:
        type_formatted = notification_type.replace("_", " ")
        type_formatted = split_pascal_case(type_formatted)
        type_formatted = convert_to_past_tense(type_formatted)
        title = f"{type_formatted} {hook_formatted}"
    else:
        title = hook_formatted

    title = title.title()
    body = message if message else title

    write_log(f"Notification: title='{title}' body='{body}'")

    if hook_event_name == "Stop":
        transcript_path = data.get("transcript_path")
        if transcript_path:
            spawn_stop_verifier(transcript_path, title, body)
        else:
            write_log("No transcript_path in Stop event, notifying immediately")
            send_notification(title, body)
        return

    send_notification(title, body)


if __name__ == "__main__":
    main()
