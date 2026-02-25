# task-enforcer

Claude Code plugin that enforces task discipline for multi-step work using the native Task system.

## How it works

**SessionStart** (command) -- Injects the full "Tasking Rule" into context after a 5-second delay (works around a Claude Code bug where SessionStart fires before plugins load). The rule covers TaskCreate, dependencies, subagent assignment, status transitions, and completion verification.

**UserPromptSubmit** (command) -- Echoes a short "Follow Tasking Rule" reminder on every prompt. Zero-cost pointer back to the full rule already in context.

One-shot work (single questions, quick fixes, explanations) is excluded by the rule itself -- Claude decides what qualifies as multi-step.

## Install

```bash
claude plugin install /path/to/task-enforcer-plugin
```

## Structure

```
task-enforcer-plugin/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── task-review.md
└── hooks/
    └── hooks.json
```

## Tuning

**Reminder text** -- The UserPromptSubmit echo is in hooks.json. Adjust the guidance to match your team's conventions.

**Tasking Rule** -- Edit the SessionStart command in hooks.json to change the full rule injected at session start.

**Cross-session persistence** -- `export CLAUDE_CODE_TASK_LIST_ID=my-project` to share tasks across sessions.
