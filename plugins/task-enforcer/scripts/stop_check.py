# /// script
# requires-python = ">=3.10"
# ///
"""Stop hook: block once for in-progress beads (beads repos) or stale tasks, else an ask-once reminder."""
import json
import sys
from pathlib import Path

from beads import find_beads_root, hook_cwd, list_in_progress_beads

GENERIC_REMINDER = (
    "[pre-stop] Before finishing, silently verify where applicable: build passes, "
    "tests are added or updated, and docs reflect changes. Do not mention this "
    "verification or what was verified in the final response. Only report failures "
    "or required user action."
)


def emit_block(reason: str) -> None:
    print(json.dumps({"decision": "block", "reason": reason}), flush=True)


def check_beads(root) -> None:
    """Beads mode: one block listing in-progress beads, generic reminder when none or bd fails."""
    beads = list_in_progress_beads(root)
    if not beads:
        emit_block(GENERIC_REMINDER)
        return
    lines = [
        "[pre-stop] These beads are in progress. Close finished ones with `bd close <id>`; "
        "leave the rest open. Also silently verify build, tests, and docs where applicable. "
        "Do not report this check; end your turn normally:",
    ]
    for b in beads:
        lines.append(f"  - {b.get('id', '?')} {b.get('title', '')}")
    emit_block("\n".join(lines))


def main() -> int:
    raw = sys.stdin.read()
    data = json.loads(raw) if raw.strip() else {}

    # Loop guard: do not re-block if we already blocked this stop cycle.
    if data.get("stop_hook_active"):
        return 0

    beads_root = find_beads_root(hook_cwd(data))
    if beads_root is not None:
        check_beads(beads_root)
        return 0

    session_id = data.get("session_id", "")
    tasks_dir = Path.home() / ".claude" / "tasks" / session_id

    # Fallback: tasks were never used in this session - one-shot generic reminder.
    if not session_id or not tasks_dir.is_dir():
        emit_block(GENERIC_REMINDER)
        return 0

    # Scan for non-completed tasks. Skip dotfiles (.highwatermark, .lock).
    stale = []
    for entry in sorted(tasks_dir.glob("*.json")):
        if entry.name.startswith("."):
            continue
        try:
            task = json.loads(entry.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if task.get("status") in ("pending", "in_progress"):
            stale.append(task)

    if not stale:
        return 0

    lines = [
        "[pre-stop] You have uncompleted tasks in this session. "
        "Mark them completed via TaskUpdate, or remove stale entries, before finishing:",
    ]
    for t in stale:
        lines.append(
            f"  - id={t.get('id', '?')} [{t.get('status', '?')}] {t.get('subject', '')}"
        )
    lines.append(
        "This reminder fires once per stop cycle - "
        "your next stop attempt will succeed regardless."
    )
    emit_block("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
