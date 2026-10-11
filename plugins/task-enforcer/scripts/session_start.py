# /// script
# requires-python = ">=3.10"
# dependencies = ["psutil"]
# ///
"""Injects the tasking or beads rule into Claude Code session context.

The mode is picked per call: beads when .beads/ sits in the cwd or a parent up to the git root, tasks otherwise.

Two invocation modes:
  --prompt  (UserPromptSubmit): full rule on the first prompt or after a mode switch, one-line reminder afterwards
  --session (SessionStart):     marker exists -> re-inject the full rule after resume/clear/compact, no marker -> exit
"""
import glob
import json
import os
import sys
import tempfile
import time

import psutil

from beads import BEADS_REMINDER, BEADS_RULE, find_beads_root, hook_cwd

MARKER_PREFIX = ".task-enforcer-"
MARKER_MAX_AGE = 86400  # 1 day in seconds

TASKING_RULE = """\
# Tasking Rule (MANDATORY)

**Applies to ALL multi-step work.** Skip for single questions, quick fixes, and changes under 3 steps.

## Core Requirement

**Decompose before executing.** Settle the ordered steps, their dependencies, and what done looks like for each BEFORE implementation begins.

- Record the plan with TaskCreate when the session has it; otherwise post a numbered plan in the reply and restate the remaining steps as you go
- Include acceptance criteria per step
- Declare dependencies (addBlockedBy/addBlocks when using Task tools)
- Track every step: pending -> in_progress -> completed
- Before finishing, walk the list and confirm nothing is unstarted or half-done

## Parallelization

- Steps without dependencies SHOULD run concurrently
- **4+ independent steps:** spawn subagents, one per workstream
- **Fewer than 4 independent steps:** execute sequentially - subagent overhead isn't worth it

## Validation

**When changes affect behavior across 3+ files or involve architectural decisions:**
- Add a validation step that verifies results against acceptance criteria
- Add new steps for any issues found during validation"""

TASKING_REMINDER = "Tasking Rule applies: decompose multi-step work into tracked steps before editing."

RULES = {
    "tasks": (TASKING_RULE, TASKING_REMINDER),
    "beads": (BEADS_RULE, BEADS_REMINDER),
}


def find_claude_pid():
    """Walk up process tree to find ancestor claude process."""
    pid = os.getpid()
    for _ in range(10):
        try:
            proc = psutil.Process(pid)
            name = proc.name().lower()
            if "claude" in name:
                return pid
            pid = proc.ppid()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            break
    return None


def cleanup_old_markers(tmp_dir):
    """Remove marker files older than 1 day."""
    markers = glob.glob(os.path.join(tmp_dir, f"{MARKER_PREFIX}*"))
    for path in markers:
        try:
            age = time.time() - os.path.getmtime(path)
            if age > MARKER_MAX_AGE:
                os.remove(path)
        except OSError:
            pass


def marker_path(tmp_dir, claude_pid):
    return os.path.join(tmp_dir, f"{MARKER_PREFIX}{claude_pid}")


def read_marker(tmp_dir, claude_pid):
    """Return the mode recorded for this Claude session, None when no marker exists."""
    path = marker_path(tmp_dir, claude_pid)
    try:
        with open(path, encoding="utf-8") as f:
            return f.read().strip()
    except OSError:
        return None


def write_marker(tmp_dir, claude_pid, mode):
    """Record the mode whose full rule was last injected for this Claude session."""
    with open(marker_path(tmp_dir, claude_pid), "w", encoding="utf-8") as f:
        f.write(mode)


def read_hook_input():
    """Parse the hook JSON payload from stdin, empty dict when absent."""
    try:
        raw = sys.stdin.read()
        return json.loads(raw) if raw.strip() else {}
    except (OSError, ValueError):
        return {}


def inject(hook_event_name, text):
    """Print the given text as hook output."""
    output = {
        "hookSpecificOutput": {
            "hookEventName": hook_event_name,
            "additionalContext": text,
        }
    }
    print(json.dumps(output), flush=True)


if __name__ == "__main__":
    mode_arg = sys.argv[1] if len(sys.argv) > 1 else "--prompt"

    tmp_dir = tempfile.gettempdir()
    cleanup_old_markers(tmp_dir)

    mode = "beads" if find_beads_root(hook_cwd(read_hook_input())) else "tasks"
    rule, reminder = RULES[mode]

    claude_pid = find_claude_pid()
    marker_mode = read_marker(tmp_dir, claude_pid) if claude_pid else None

    if mode_arg == "--prompt":
        if marker_mode == mode:
            inject("UserPromptSubmit", reminder)
            sys.exit(0)
        if claude_pid:
            write_marker(tmp_dir, claude_pid, mode)
        inject("UserPromptSubmit", rule)

    elif mode_arg == "--session":
        if marker_mode is None:
            sys.exit(0)
        write_marker(tmp_dir, claude_pid, mode)
        inject("SessionStart", rule)
