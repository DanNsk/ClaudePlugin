# task-enforcer

Claude Code plugin that enforces planning discipline for multi-step work. Each repo runs in exactly one mode: beads or tasks.

## Modes

A repo is in **beads mode** when a `.beads/` folder sits in the working directory or any parent up to the git root. Every other repo is in **tasks mode**. The mode is detected on every prompt, so moving into a beads repo mid-session switches it.

**Tasks mode** injects the Tasking Rule: decompose multi-step work into ordered steps with acceptance criteria before editing. The steps go into TaskCreate when the session has the Task tools, and into a numbered plan in the reply otherwise.

**Beads mode** injects the Beads Rule instead: track work with `bd`, claim a bead before editing, close it when done. The Tasking Rule is not injected in beads repos.

## Hooks

**UserPromptSubmit** - Injects the full rule for the current mode on the first prompt and whenever the mode changes. Every later prompt gets a one-line reminder.

**SessionStart** (resume, clear, compact) - Re-injects the full rule when the session already saw it. Startup itself is skipped, because SessionStart can fire before plugins load.

**PreToolUse** (Edit, Write, MultiEdit, NotebookEdit) - Beads mode only. Denies the edit when the target file is inside the beads repo and `bd list --status=in_progress` is empty. Files outside the repo are never blocked. The hook fails open when `bd` is missing, errors, or times out.

**Stop** - Blocks once per stop cycle:
- Beads mode: lists in-progress beads and asks to close finished ones.
- Tasks mode with a task list: lists pending and in-progress tasks.
- Otherwise: a silent build, test, and docs check reminder.

## Install

```bash
claude plugin install task-enforcer@dabystrukhin-plugins
```

Requires [uv](https://docs.astral.sh/uv/). Beads mode requires `bd` on PATH.

## Tuning

- Rule and reminder text for tasks mode: `scripts/session_start.py`
- Rule, reminder, and deny text for beads mode: `scripts/beads.py` and `scripts/pre_edit_check.py`
- Cross-session task persistence: `export CLAUDE_CODE_TASK_LIST_ID=my-project`
