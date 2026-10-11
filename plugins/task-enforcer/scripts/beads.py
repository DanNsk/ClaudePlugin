"""Beads (bd) repo detection shared by task-enforcer hooks."""
import json
import os
import subprocess
from pathlib import Path

BD_TIMEOUT = 5

BEADS_RULE = """\
# Beads Rule (MANDATORY)

This repo tracks work with beads (`bd`). Use beads instead of TaskCreate here; the Tasking Rule does not apply in this repo.

- Before editing files, create or claim a bead: `bd ready` to find work, `bd create "<title>"` for new work, then `bd update <id> --status in_progress`
- Edits are blocked while no bead is in progress
- Close the bead with `bd close <id>` when the work is done"""

BEADS_REMINDER = "Beads repo: claim a bead (`bd update <id> --status in_progress`) before editing, close it with `bd close <id>` when done."


def list_in_progress_beads(root):
    """In-progress beads as dicts, None when bd cannot answer."""
    try:
        result = subprocess.run(
            ["bd", "list", "--status=in_progress", "--json", "--brief"],
            cwd=str(root),
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=BD_TIMEOUT,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if result.returncode != 0:
        return None
    try:
        issues = json.loads(result.stdout or "[]")
    except ValueError:
        return None
    return issues if isinstance(issues, list) else None


def find_beads_root(start):
    """Return the nearest ancestor of start holding .beads/, stopping at the git root."""
    if not start:
        return None
    path = Path(start).resolve()
    if not path.is_dir():
        path = path.parent
    for candidate in (path, *path.parents):
        if (candidate / ".beads").is_dir():
            return candidate
        if (candidate / ".git").exists():
            return None
    return None


def has_in_progress_bead(root):
    """True when bd lists an in_progress bead, None when bd cannot answer."""
    issues = list_in_progress_beads(root)
    return None if issues is None else bool(issues)


def hook_cwd(data):
    """Working directory reported by the hook payload, falling back to the process cwd."""
    return data.get("cwd") or os.getcwd()
