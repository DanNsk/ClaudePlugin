# /// script
# requires-python = ">=3.10"
# ///
"""SessionStart hook: injects the tasking or beads rule into Claude Code session context.

The mode is picked per call: beads when .beads/ sits in the cwd or a parent up to the git root, tasks otherwise.
"""
import json
import sys

from beads import BEADS_RULE, find_beads_root, hook_cwd

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

RULES = {
    "tasks": TASKING_RULE,
    "beads": BEADS_RULE,
}


def read_hook_input():
    """Parse the hook JSON payload from stdin, empty dict when absent."""
    try:
        raw = sys.stdin.read()
        return json.loads(raw) if raw.strip() else {}
    except (OSError, ValueError):
        return {}


if __name__ == "__main__":
    mode = "beads" if find_beads_root(hook_cwd(read_hook_input())) else "tasks"
    output = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": RULES[mode],
        }
    }
    print(json.dumps(output), flush=True)
