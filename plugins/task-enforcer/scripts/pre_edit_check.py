# /// script
# requires-python = ">=3.10"
# ///
"""PreToolUse hook: block file edits inside a beads repo while no bead is in progress."""
import json
import sys

from beads import find_beads_root, has_in_progress_bead, hook_cwd

DENY_REASON = (
    "This repo uses beads and no bead is in progress. Create or claim a bead first: "
    "`bd ready` or `bd create \"<title>\"`, then `bd update <id> --status in_progress`. "
    "Retry the edit afterwards."
)


def main() -> int:
    raw = sys.stdin.read()
    data = json.loads(raw) if raw.strip() else {}

    tool_input = data.get("tool_input") or {}
    target = tool_input.get("file_path") or tool_input.get("notebook_path") or hook_cwd(data)

    root = find_beads_root(target)
    if root is None:
        return 0

    # Fail open when bd is missing or errors, so a broken bd install never locks the repo.
    if has_in_progress_bead(root) is not False:
        return 0

    output = {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": DENY_REASON,
        }
    }
    print(json.dumps(output), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
