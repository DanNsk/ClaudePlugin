# /// script
# requires-python = ">=3.10"
# dependencies = ["psutil"]
# ///
"""Injects tasking rule into Claude Code session context.

Two invocation modes:
  --prompt  (UserPromptSubmit): no marker -> inject + create marker, marker exists -> exit
  --session (SessionStart):     marker exists -> inject (re-inject after resume/clear), no marker -> exit
"""
import glob
import json
import os
import sys
import tempfile
import time

import psutil

MARKER_PREFIX = ".task-enforcer-"
MARKER_MAX_AGE = 86400  # 1 day in seconds

TASKING_RULE = """\
# Tasking Rule (MANDATORY)

**Applies to ALL multi-step work.** Skip for single questions, quick fixes, and changes under 3 steps.

## Core Requirement

**Decompose before executing.** Break work into tasks using TaskCreate BEFORE implementation begins.

- Include acceptance criteria in the description
- Declare dependencies with addBlockedBy/addBlocks
- Transition every task: pending -> in_progress -> completed
- Run TaskList before finishing to verify all tasks are done

## Parallelization

- Tasks without dependencies SHOULD run concurrently
- **4+ independent tasks:** spawn subagents via Task tool, one per workstream
  - Each subagent claims tasks via TaskUpdate (set owner)
- **Fewer than 4 independent tasks:** execute sequentially - subagent overhead isn't worth it

## Validation

**When changes affect behavior across 3+ files or involve architectural decisions:**
- Create a validation task that verifies results against acceptance criteria
- Create new tasks for any issues found during validation"""


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


def inject(hook_event_name):
    """Print the tasking rule as hook output."""
    output = {
        "hookSpecificOutput": {
            "hookEventName": hook_event_name,
            "additionalContext": TASKING_RULE,
        }
    }
    print(json.dumps(output), flush=True)


if __name__ == "__main__":
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
