---
name: wrap-up
description: Use when the user says "wrap up", "close session", "end session", "wrap things up", "close out this task", or invokes /wrap-up. Runs an end-of-session checklist covering uncommitted work, open tasks or beads, and knowledge worth keeping.
---

# Session Wrap-Up

Run the three phases in order, then send one short report. The report lists only what changed and what the user must act on.

## Phase 1: Uncommitted work

For each repo touched during the session:

1. Run `git status`.
2. If changes are uncommitted, run the repo's build and tests first. Commit only when they pass. A failing gate is reported, never committed around.
3. Commit on the current branch with a one-line message.
4. Do not push, deploy, rename, or move files. Report unpushed commits instead, and let the user decide.

## Phase 2: Open work items

- **Beads repo** (a `.beads/` folder up to the git root): run `bd list --status=in_progress`. Close finished beads with `bd close <id>`. Report beads that are still open, with one line on what remains.
- **Otherwise**: if the session has a task list, mark finished tasks completed and report anything pending or in progress.

## Phase 3: Knowledge worth keeping

Review the session for facts a future session would need and could not derive from the code or git history: a non-obvious project quirk, a corrected assumption, a convention the user stated.

Place each one by scope:

- **Auto memory**: insights and quirks for this project. Write them directly.
- **Project `CLAUDE.md` or `.claude/rules/`**: permanent project conventions. Use `.claude/rules/` with `paths:` frontmatter when the rule applies only to certain files.
- **Global `AGENTS.md` or `CLAUDE.md`**: propose the exact edit in the report and wait for approval. These files may be synced from elsewhere, so a direct edit can drift or be overwritten.

Never write secrets, credentials, or client data into any of these files.

If nothing qualifies, skip the phase silently.

## Report

One short list:

- Commits made, with their one-line messages
- Unpushed commits and uncommitted changes left behind, with the reason
- Beads or tasks still open
- Proposed edits to global instruction files

Omit any item that has nothing to report. If every phase came up empty, reply "Nothing to wrap up."
