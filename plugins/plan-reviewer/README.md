# plan-reviewer

A browser-based annotation tool for reviewing Claude Code plans. When Claude finishes generating a plan and calls `ExitPlanMode`, this plugin intercepts the permission request, opens a visual UI in your browser, and lets you annotate specific lines before approving or requesting changes.

## How it works

Claude Code calls `ExitPlanMode` when transitioning from plan mode to execution. Since that tool requires permission, the `PermissionRequest` hook fires. This plugin hooks into that moment, spins up a local HTTP server, and opens a line-by-line markdown viewer where you can select text and add annotations.

Your decision flows back to Claude Code through stdout:
- **Approve** sends `behavior: "allow"` and Claude proceeds with implementation.
- **Request Changes** sends `behavior: "deny"` with line-referenced annotations as the reason, so Claude revises the plan.

## Install

Copy the `plugins/plan-reviewer` directory into your Claude Code plugins folder, or enable it via the plugin system.

## Usage

Use Claude Code with plan mode. When the plan is ready and Claude calls `ExitPlanMode`, your browser opens automatically with the plan displayed line-by-line.

### Reviewing a plan

1. Read through the rendered markdown with line numbers in the left gutter
2. Select text across one or more lines to get a floating action menu
3. Click the comment icon to add a comment annotation, or the X icon to mark lines for deletion
4. Annotation bubbles appear in the right column with line/column references
5. Click a bubble's text to edit it, or the X button to remove it
6. Click "+" at the bottom of the plan to add a comment without selecting text
7. Hit **Approve Plan** or **Request Changes**

Keyboard shortcuts:
- `Ctrl + Enter` - approve (or send changes if you have annotations)
- `Esc` - dismiss floating menu

## Markdown rendering

The viewer renders a subset of markdown line-by-line:

- **Headings** (h1-h6) with scaled font sizes; h2 highlighted in accent color
- **Code blocks** with fenced ` ``` ` syntax, monospace font, preserved indentation, and a left border indicator
- **Inline code**, **bold**, *italic*, links, and images
- **Lists** (unordered and ordered) with up to 3 indent levels
- **Tables** with pipe syntax (`| col | col |`), bold header row, aligned columns via CSS table layout
- **Horizontal rules** (`---`, `***`, `___`)
- **Mermaid diagrams** - fenced ` ```mermaid ` blocks render the source lines (annotatable) and an SVG diagram below via mermaid.js with dark theme

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PLAN_REVIEWER_PORT` | random | Fixed port (useful for SSH forwarding) |
| `PLAN_REVIEWER_NO_OPEN` | unset | Set to `1` to skip auto-opening browser; prints URL to stderr instead |

### SSH / remote use

Forward a fixed port and set the env vars:

```bash
ssh -L 9999:127.0.0.1:9999 your-server
# on the server:
export PLAN_REVIEWER_PORT=9999
export PLAN_REVIEWER_NO_OPEN=1
```

## Project structure

```
plan-reviewer/
  .claude-plugin/
    plugin.json
  hooks/
    hooks.json           # PermissionRequest hook on ExitPlanMode (24h timeout)
  scripts/
    review.py            # Python server (stdlib only)
    resources/
      template.html      # Page shell, injects plan JSON + port as JS globals
      review.css         # All styling, dark theme via CSS custom properties
      review.js          # Line parser, renderer, annotation engine, submit logic
  README.md
```

## Architecture notes

These notes capture design decisions and gotchas for future development.

### Plan injection

`review.py` reads the plan text from the hook's stdin JSON (`tool_input.plan` or `data.plan`), falling back to the most recently modified `~/.claude/plans/*.md` file, then to a raw JSON dump of `tool_input`. The text is JSON-encoded via `json.dumps` and injected into `template.html` by replacing the `__PLAN_JSON__` placeholder. A `.replace("</", r"<\/")` pass prevents `</script>` sequences in plan content from breaking the HTML parser.

### Line-by-line parsing (review.js)

`classifyLine(raw)` is a stateful function that classifies each line of the plan into a CSS class and HTML fragment. State variables (`inCodeBlock`, `inMermaidBlock`, `inTable`) track multi-line constructs. The function returns `{ cls, html }` (and optionally `raw` for mermaid source lines).

The `render()` function runs `classifyLine` over every line, then builds HTML in a second pass. The second pass handles grouping: contiguous table rows are wrapped in `.table-block` divs (CSS table layout), and mermaid blocks get a wrapper with both source lines and a `<pre class="mermaid">` container for rendering.

Key parsing details:
- Code fences toggle `inCodeBlock`; a ` ```mermaid ` fence also sets `inMermaidBlock`
- Table rows are detected by a leading `|`; separator rows (`|---|---|`) are detected but skipped in output, and the row before a separator gets the `table-header` class
- Horizontal rules match `/^(\s*[-*_]\s*){3,}$/` - note this can conflict with `---` separator rows if not inside a table context (the table check runs first)
- Inline rendering handles bold, italic, inline code, links, and images via regex replacement on escaped HTML

### CSS design

All colors, radii, and the monospace font stack are defined as CSS custom properties in `:root`. The layout is a two-column CSS grid: content on the left, annotation bubbles on the right. Line numbers use `::before` pseudo-elements with `content: attr(data-line)` - no JS height synchronization needed. Table rows override `::before` with `display: none` and use a dedicated `.table-gutter` cell instead, since CSS table layout requires all cells to be direct children. Code blocks use `::after` for left-border indicators (since `::before` is already the line number).

### Annotation system

Annotations are stored in a JS array with `{ id, type, startLine, startCol, endLine, endCol, text }`. When created from a text selection, the browser Range is used to wrap selected text nodes in `<span class="annot-mark">` elements via `surroundContents`. Comment annotations get a yellow underline, delete annotations get red strikethrough. Hovering an annotation bubble highlights its marks in the content via a CSS class toggle. The wrapping operates on DOM text nodes directly, so it survives across element boundaries with a fallback (annotation still exists in the data model if wrapping fails).

### Mermaid rendering

Mermaid.js is loaded from CDN (`mermaid@11`). After `innerHTML` is set, `mermaid.initialize()` configures dark theme colors matching the reviewer palette, then `mermaid.run()` processes all `<pre class="mermaid">` elements. The source lines remain visible and annotatable above the rendered SVG.

### Hook configuration

The hook fires on `PermissionRequest` matching `ExitPlanMode`. Timeout is set to 86400 seconds (24 hours) to allow extended review sessions. The server shuts down on SIGTERM or when a decision POST arrives.

## Changelog

### 1.5.0
- Table header rows rendered bold; separator rows hidden
- Mermaid diagram rendering (source + SVG) via mermaid.js CDN
- Code blocks preserve indentation with `white-space: pre`
- Horizontal rules confined to content area (no gutter bleed)
- Plan injection escapes `</script>` sequences
- CSS custom properties consolidated (colors, radii, font stack)
- Hook timeout increased to 24 hours

### 1.0.0
- Line numbers via CSS `::before` pseudo-elements
- Inline code, bold, italic, links, images
- List items with indent levels
- Tables with CSS table layout and column alignment
- Character-level annotation wrapping
- "+" button for end-of-plan comments
- Deny feedback uses `message` field for proper delivery to Claude

## Zero dependencies

The server uses only Python stdlib (`http.server`, `json`, `webbrowser`, `threading`). The browser UI is self-contained HTML/CSS/JS with mermaid.js loaded from CDN.

## License

MIT
