---
name: ui-designer
description: Build UIs with Basecoat - Tailwind-based component classes for plain HTML. Use for forms, buttons, cards, tables, modals, dashboards, landing pages, email templates. Works with any backend (Flask, Django, Rails, Laravel, PHP, static HTML). Skip this skill if user explicitly requests React/Vue/Angular.
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch, WebSearch, Task
---

# UI Designer: Basecoat UI

Component classes for plain HTML. No React, no build step, no JSX.

## When to Use

- HTML/CSS interfaces, forms, dashboards
- Server-rendered templates (Jinja2, Razor, Blade, ERB, PHP)
- Static sites, prototypes, email templates
- Any UI where React/Vue/Angular is overkill

## When NOT to Use

- User explicitly asks for React, Vue, Angular, or Svelte
- Project already uses shadcn/ui or similar
- User wants a specific component library

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://cdn.jsdelivr.net/npm/basecoat-css/dist/basecoat.css" rel="stylesheet">
</head>
<body class="p-8">
  <div class="card max-w-md">
    <div class="card-header">
      <h2 class="card-title">Login</h2>
    </div>
    <form class="card-content form">
      <fieldset>
        <label for="email">Email</label>
        <input type="email" id="email" class="input" required>
      </fieldset>
      <fieldset>
        <label for="password">Password</label>
        <input type="password" id="password" class="input" required>
      </fieldset>
      <button type="submit" class="btn btn-primary w-full">Sign In</button>
    </form>
  </div>
</body>
</html>
```

## Core Classes

| Element | Class | Notes |
|---------|-------|-------|
| Button | `btn`, `btn-primary`, `btn-outline`, `btn-ghost`, `btn-destructive` | Use native `<button>` |
| Input | `input` | Works with text, email, password, etc. |
| Textarea | `textarea` | |
| Select | `select` | Native `<select>` element |
| Checkbox | `checkbox` | |
| Radio | `radio` | |
| Switch | `switch` | Toggle style checkbox |
| Card | `card`, `card-header`, `card-content`, `card-footer`, `card-title` | |
| Table | `table`, wrap in `table-container` | |
| Badge | `badge`, `badge-primary`, `badge-destructive` | |
| Alert | `alert`, `alert-success`, `alert-warning`, `alert-destructive` | |
| Form | `form` | Auto-styles nested fieldsets/labels |

See `@references/components.md` for full examples.

## Interactive Components

These need vanilla JS: tabs, dialog, dropdown, select (custom), popover, sidebar, toast, command.

Key patterns:
- **Dialog**: Use native `<dialog>` + `showModal()` / `close()`
- **Tabs**: ARIA `aria-selected` + show/hide panels
- **Dropdown**: Toggle visibility + close on outside click

See `@references/interactive-components.md` for copy-paste patterns.

## Principles

1. **Native HTML first** - `<dialog>`, `<details>`, `<fieldset>`, `<select>`
2. **Classes not components** - `class="btn"` not `<Button>`
3. **CSS states over JS** - `:checked`, `:focus`, `:disabled`, `aria-invalid`
4. **Vanilla JS when needed** - No framework, no state management

## When Unsure

If a component pattern isn't clear from the references, spawn a subagent to fetch the kitchen sink page and extract the exact markup:

> Fetch https://basecoatui.com/kitchen-sink and find the [component] pattern. Return the HTML with classes.

The kitchen sink is the source of truth - it has every component with real markup.

## References

- `@references/components.md` - CSS-only components
- `@references/interactive-components.md` - JS-requiring components
- https://basecoatui.com/kitchen-sink - All components (source of truth)
- https://basecoatui.com/docs - Official docs
