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
/plugin install structured-dev@dabystrukhin-plugins
/plugin install plan-reviewer@dabystrukhin-plugins
/plugin install task-enforcer@dabystrukhin-plugins
/plugin install windows-user-identity@dabystrukhin-plugins
/plugin install clangd-ex-lsp@dabystrukhin-plugins
/plugin install gopls-ex-lsp@dabystrukhin-plugins
/plugin install omnisharp-lsp@dabystrukhin-plugins
/plugin install powershell-lsp@dabystrukhin-plugins
/plugin install pyright-ex-lsp@dabystrukhin-plugins
/plugin install vscode-langservers-ex-lsp@dabystrukhin-plugins
/plugin install vtsls-lsp@dabystrukhin-plugins
```

### CLI (scriptable)

Same thing from a terminal, no interactive session needed:

```bash
claude plugin marketplace add https://github.com/DanNsk/ClaudePlugin.git

claude plugin install notifications@dabystrukhin-plugins
claude plugin install utility-skills@dabystrukhin-plugins
claude plugin install structured-dev@dabystrukhin-plugins
claude plugin install plan-reviewer@dabystrukhin-plugins
claude plugin install task-enforcer@dabystrukhin-plugins
claude plugin install windows-user-identity@dabystrukhin-plugins
claude plugin install clangd-ex-lsp@dabystrukhin-plugins
claude plugin install gopls-ex-lsp@dabystrukhin-plugins
claude plugin install omnisharp-lsp@dabystrukhin-plugins
claude plugin install powershell-lsp@dabystrukhin-plugins
claude plugin install pyright-ex-lsp@dabystrukhin-plugins
claude plugin install vscode-langservers-ex-lsp@dabystrukhin-plugins
claude plugin install vtsls-lsp@dabystrukhin-plugins
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

Collection of utility skills and agents.

**Skills:**
- **Codebase Research** - Generate comprehensive codebase documentation (architecture diagrams, component docs, dependency maps)
- **Docotic PDF** - Guide for working with BitMiracle Docotic.Pdf library in C#/.NET
- **Humanizer** - Remove signs of AI-generated writing from text
- **LSP Usage Guide** - LSP-first navigation rules and operation reference for code intelligence
- **Mermaid Diagrams** - Generate diagrams from Mermaid markup using mermaid-cli
- **NuGet Version Check** - Methods for checking latest NuGet package versions
- **Spec Writer** - Interactive requirements elicitation and spec drafting through structured Q&A
- **Task Triage** - Decision framework for plan mode vs direct execution
- **UI Designer** - Build UIs with Basecoat (Tailwind-based component classes for plain HTML)
- **Wrap-up** - End-of-session checklist for shipping, memory, and self-improvement

**Agents:**
- **Project Orchestrator** - Orchestrates complex multi-phase tasks with decomposition, parallel execution, and sub-agent coordination
- **Meta-Agent** - Generates new Claude Code sub-agent configuration files from a description

### Structured Dev

Multi-agent structured development workflow with ACID planning. Breaks complex implementation into five phases, each run by a specialized agent.

**Agents:**
- **Requirements Builder** - Analyzes user requests and builds structured requirements documents
- **Due Diligence Researcher** - Validates requirements against codebase reality, maps affected code paths
- **ACID Planner** - Creates implementation plans where each step is atomic, consistent, isolated, and durable
- **Implementer** - Implements a single task from an ACID plan, following identified patterns
- **Validator** - Validates implementation against requirements, reviews code quality, runs build/tests

### Plan Reviewer

Browser-based annotation tool for reviewing Claude Code plans. When Claude finishes generating a plan and calls `ExitPlanMode`, the plugin intercepts the permission request, opens a visual UI in the browser, and lets you annotate specific lines before approving or requesting changes.

**Features:**
- Line-by-line markdown rendering with headings, code blocks, tables, mermaid diagrams
- Text selection with comment and delete annotations
- Annotation bubbles with line/column references
- Console approval detection (browser stays alive with overlay)

**Environment variables:**

| Variable | Default | Description |
|---|---|---|
| `PLAN_REVIEWER_PORT` | random | Fixed port (useful for SSH forwarding) |
| `PLAN_REVIEWER_NO_OPEN` | unset | Set to `1` to skip auto-opening browser; prints URL to stderr |

### Task Enforcer

Injects task management discipline on session start, reminds on each prompt. Skips one-shot tasks automatically.

**Hooks:**
- `SessionStart` - Injects full tasking rule into context
- `UserPromptSubmit` - Echoes short reminder on every prompt

### Windows User Identity

Resolves the current Windows user's full display name (not login username) and injects it into session context at startup. Windows only - no-op on other platforms.

**Prerequisites:**
- [uv](https://docs.astral.sh/uv/) (Python package manager)

### LSP Plugins

Language Server Protocol integrations for code intelligence features.

| Plugin | Languages | Prerequisites |
|--------|-----------|---------------|
| clangd-ex-lsp | C, C++ | [LLVM/Clangd](https://clangd.llvm.org/) |
| gopls-ex-lsp | Go | `go install golang.org/x/tools/gopls@latest` |
| omnisharp-lsp | C# | [OmniSharp](https://github.com/OmniSharp/omnisharp-roslyn) |
| powershell-lsp | PowerShell | PowerShell 7+, PowerShellEditorServices |
| pyright-ex-lsp | Python | Node.js, `npm install -g pyright` |
| vscode-langservers-ex-lsp | HTML, CSS, JSON | Node.js, `npm install -g vscode-langservers-extracted` |
| vtsls-lsp | TypeScript, JavaScript | Node.js, `npm install -g @vtsls/language-server` |

**Attribution:** LSP plugins based on [Piebald-AI/claude-code-lsps](https://github.com/Piebald-AI/claude-code-lsps).

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
    |   +-- agents/
    |   |   +-- meta-agent.md
    |   |   +-- project-orchestrator.md
    |   +-- skills/
    |       +-- codebase-research/
    |       +-- docotic-pdf/
    |       +-- humanizer/
    |       +-- lsp-usage/
    |       +-- mermaid-diagrams/
    |       +-- nuget-version-check/
    |       +-- spec-writer/
    |       +-- task-triage/
    |       +-- ui-designer/
    |       +-- wrap-up/
    +-- structured-dev/
    |   +-- .claude-plugin/plugin.json
    |   +-- agents/ (5 agents)
    |   +-- skills/structured-dev/
    +-- plan-reviewer/
    |   +-- .claude-plugin/plugin.json
    |   +-- hooks/hooks.json
    |   +-- scripts/review.py
    |   +-- scripts/resources/ (html, css, js)
    +-- task-enforcer/
    |   +-- .claude-plugin/plugin.json
    |   +-- hooks/hooks.json
    +-- windows-user-identity/
    |   +-- .claude-plugin/plugin.json
    |   +-- hooks/hooks.json
    |   +-- scripts/session_start_user.py
    +-- clangd-ex-lsp/
    +-- gopls-ex-lsp/
    +-- omnisharp-lsp/
    +-- powershell-lsp/
    +-- pyright-ex-lsp/
    +-- vscode-langservers-ex-lsp/
    +-- vtsls-lsp/
```

## Windows Notes

- Node.js-based LSP servers use `cmd /c` prefix for proper Windows execution
- Notifications use Python (via uv) and only trigger when workstation is locked (detects LogonUI process)

## License

MIT
