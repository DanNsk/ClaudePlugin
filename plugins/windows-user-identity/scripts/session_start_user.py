# /// script
# requires-python = ">=3.10"
# dependencies = ["psutil"]
# ///
"""Resolves Windows user full display name and injects it into Claude Code session context.

Two invocation modes:
  --prompt  (UserPromptSubmit): no marker -> inject + create marker, marker exists -> exit
  --session (SessionStart):     marker exists -> inject (re-inject after resume/clear), no marker -> exit
"""
import glob
import json
import os
import platform
import sys
import tempfile
import time

import psutil

MARKER_PREFIX = ".win-user-identity-"
MARKER_MAX_AGE = 86400  # 1 day in seconds


def find_claude_pid():
    """Walk up process tree to find ancestor claude process."""
    pid = os.getpid()
    for _ in range(10):
        try:
            proc = psutil.Process(pid)
            if "claude" in proc.name().lower():
                return pid
            pid = proc.ppid()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            break
    return None


def cleanup_old_markers(tmp_dir):
    """Remove marker files older than 1 day."""
    cutoff = time.time() - MARKER_MAX_AGE
    for path in glob.glob(os.path.join(tmp_dir, f"{MARKER_PREFIX}*")):
        try:
            if os.path.getmtime(path) < cutoff:
                os.remove(path)
        except OSError:
            pass


def marker_exists(tmp_dir, claude_pid):
    """Check if marker exists for this Claude session. Touch if found."""
    marker_path = os.path.join(tmp_dir, f"{MARKER_PREFIX}{claude_pid}")
    if os.path.exists(marker_path):
        try:
            os.utime(marker_path, None)
        except OSError:
            pass
        return True
    return False


def create_marker(tmp_dir, claude_pid):
    """Create marker file for this Claude session."""
    marker_path = os.path.join(tmp_dir, f"{MARKER_PREFIX}{claude_pid}")
    with open(marker_path, "w") as f:
        f.write("")


def get_windows_full_name():
    """Get the Windows user's full display name via Win32 GetUserNameExW."""
    import ctypes

    getNameEx = ctypes.windll.secur32.GetUserNameExW
    NAME_DISPLAY = 3

    size = ctypes.pointer(ctypes.c_ulong(0))
    getNameEx(NAME_DISPLAY, None, size)

    if size.contents.value == 0:
        return None

    buf = ctypes.create_unicode_buffer(size.contents.value)
    result = getNameEx(NAME_DISPLAY, buf, size)

    return buf.value if result else None


def inject(hook_event_name):
    """Resolve user name and print hook output."""
    fullName = get_windows_full_name()

    if not fullName or not fullName.strip():
        sys.exit(0)

    output = {
        "hookSpecificOutput": {
            "hookEventName": hook_event_name,
            "additionalContext": (
                f"The current user's full name is: {fullName}. "
                f"Address them by their first name occasionally when appropriate, but never use it in documentation or code."
            ),
        }
    }

    print(json.dumps(output), flush=True)


if __name__ == "__main__":
    if platform.system() != "Windows":
        sys.exit(0)

    mode = sys.argv[1] if len(sys.argv) > 1 else "--prompt"

    tmp_dir = tempfile.gettempdir()
    cleanup_old_markers(tmp_dir)

    claude_pid = find_claude_pid()
    has_marker = claude_pid and marker_exists(tmp_dir, claude_pid)

    if mode == "--prompt":
        if has_marker:
            sys.exit(0)
        if claude_pid:
            create_marker(tmp_dir, claude_pid)
        inject("UserPromptSubmit")

    elif mode == "--session":
        if not has_marker:
            sys.exit(0)
        inject("SessionStart")
