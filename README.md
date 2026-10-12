# Claude Plugin Marketplace

A collection of plugins and skills for Claude Code on Windows.

## Installation

### Interactive (inside Claude Code)

Add the marketplace, then install plugins via slash commands:

```
/plugin marketplace add https://github.com/DanNsk/ClaudePlugin.git
```

```
/plugin install notifications@dabystrukhin-plugins
/plugin install utility-skills@dabystrukhin-plugins
/plugin install plan-reviewer@dabystrukhin-plugins
/plugin install task-enforcer@dabystrukhin-plugins
/plugin install windows-user-identity@dabystrukhin-plugins
```

### CLI (scriptable)

Same thing from a terminal, no interactive session needed:

```bash
claude plugin marketplace add https://github.com/DanNsk/ClaudePlugin.git

claude plugin install notifications@dabystrukhin-plugins
claude plugin install utility-skills@dabystrukhin-plugins
claude plugin install plan-reviewer@dabystrukhin-plugins
claude plugin install task-enforcer@dabystrukhin-plugins
claude plugin install windows-user-identity@dabystrukhin-plugins
```

### Auto-update

Third-party marketplaces have auto-update off by default. Enable it interactively via `/plugin` > Marketplaces tab > toggle "Enable auto-update", or set the environment variable:

```bash
export FORCE_AUTOUPDATE_PLUGINS=true
```

Plugins update automatically on Claude Code startup when enabled.

## Plugins

### Notifications

Pushover notifications for Claude Code events (only triggers when workstation is locked).

**Events:**
- Permission prompts
- Input dialogs
- Task completion
- Context compaction

**Prerequisites:**
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [Pushover](https://pushover.net/) account and API token
- Environment variables:
  - `PUSHOVER_USER` - Your Pushover user key
  - `PUSHOVER_TOKEN` - Your Pushover application token
- Optional: `NOTIFICATION_DEBUG_FILENAME` - Set to enable debug logging to cwd

### Utility Skills

Collection of utility skills.

**Skills:**
- **NuGet Version Check** - Methods for checking latest NuGet package versions
- **UI Designer** - Build UIs with Basecoat (Tailwind-based component classes for plain HTML)
- **Wrap-up** - End-of-session checklist for shipping, memory, and self-improvement

### Plan Reviewer

Browser-based annotation tool for reviewing Claude Code plans. When Claude finishes generating a plan and calls `ExitPlanMode`, the plugin intercepts the permission request, opens a visual UI in the browser, and lets you annotate specific lines before approving or requesting changes.

**Features:**
- Line-by-line markdown rendering with headings, code blocks, tables, mermaid diagrams
- Text selection with comment and delete annotations
- Annotation bubbles with line/column references
- Approve from the browser with a post-approval permission mode (auto-accept edits, manual, auto, or unchanged)
- Console approval detection (browser stays alive with overlay)

**Environment variables:**

| Variable | Default | Description |
|---|---|---|
| `PLAN_REVIEWER_PORT` | random | Fixed port (useful for SSH forwarding) |
| `PLAN_REVIEWER_NO_OPEN` | unset | Set to `1` to skip auto-opening browser; prints URL to stderr |

### Task Enforcer

Planning discipline for multi-step work, in one of two modes per repo. Repos with a `.beads/` folder get the beads rule and an edit block while no bead is in progress. Every other repo gets the tasking rule. The full rule is injected on the first prompt, then a one-line reminder on each prompt. See `plugins/task-enforcer/README.md`.

**Prerequisites:**
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- `bd` on PATH for beads mode

### Windows User Identity

Resolves the current Windows user's full display name (not login username) and injects it into session context at startup. Windows only - no-op on other platforms.

**Prerequisites:**
- [uv](https://docs.astral.sh/uv/) (Python package manager)

## Directory Structure

```
ClaudePlugin/
+-- .claude-plugin/
|   +-- marketplace.json
+-- plugins/
    +-- notifications/
    |   +-- .claude-plugin/plugin.json
    |   +-- hooks/hooks.json
    |   +-- scripts/notify.py
    +-- utility-skills/
    |   +-- .claude-plugin/plugin.json
    |   +-- skills/
    |       +-- nuget-version-check/
    |       +-- ui-designer/
    |       +-- wrap-up/
    +-- plan-reviewer/
    |   +-- .claude-plugin/plugin.json
    |   +-- hooks/hooks.json
    |   +-- scripts/review.py
    |   +-- scripts/resources/ (html, css, js)
    +-- task-enforcer/
    |   +-- .claude-plugin/plugin.json
    |   +-- hooks/hooks.json
    |   +-- scripts/ (session_start, pre_edit_check, stop_check, beads)
    +-- windows-user-identity/
        +-- .claude-plugin/plugin.json
        +-- hooks/hooks.json
        +-- scripts/session_start_user.py
```

## Windows Notes

- Notifications use Python (via uv) and only trigger when workstation is locked (detects LogonUI process)

## License

MIT
