# task-enforcer

Claude Code plugin that enforces planning discipline for multi-step work. Each repo runs in exactly one mode: beads or tasks.

## Modes

A repo is in **beads mode** when a `.beads/` folder sits in the working directory or any parent up to the git root. Every other repo is in **tasks mode**. The mode is detected each time the session starts, resumes, clears, or compacts.

**Tasks mode** injects the Tasking Rule: decompose multi-step work into ordered steps with acceptance criteria before editing. The steps go into TaskCreate when the session has the Task tools, and into a numbered plan in the reply otherwise.

**Beads mode** injects the Beads Rule instead: track work with `bd`, claim a bead before editing, close it when done. The Tasking Rule is not injected in beads repos.

## Hooks

**SessionStart** (startup, resume, clear, compact) - Injects the full rule for the current mode. Claude Code can fire SessionStart on startup before plugins load, and then the rule first arrives on the next resume, clear, or compact.

**PreToolUse** (Edit, Write, MultiEdit, NotebookEdit) - Beads mode only. Denies the edit when the target file is inside the beads repo and `bd list --status=in_progress` is empty. Files outside the repo are never blocked. The hook fails open when `bd` is missing, errors, or times out.

## Reminders

task-enforcer sends no per-prompt reminder and runs no Stop check. Reminders during the session come from agent-wire's turn-end nudges when agent-wire is installed.

## Install

```bash
claude plugin install task-enforcer@dabystrukhin-plugins
```

Requires [uv](https://docs.astral.sh/uv/). Beads mode requires `bd` on PATH.

## Tuning

- Rule text for tasks mode: `scripts/session_start.py`
- Rule and deny text for beads mode: `scripts/beads.py` and `scripts/pre_edit_check.py`
- Cross-session task persistence: `export CLAUDE_CODE_TASK_LIST_ID=my-project`
