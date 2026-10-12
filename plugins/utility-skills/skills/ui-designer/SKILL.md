---
name: ui-designer
description: Build UIs with Basecoat 1.x - shadcn/ui-style components as plain HTML with root classes and data attributes. Use for forms, buttons, cards, tables, dialogs, dashboards, and landing pages in server-rendered templates (Jinja2, Razor, Blade, ERB, PHP) or static HTML. Skip when the user asks for React, Vue, Angular, or Svelte, when the project already uses another component library, and for HTML email.
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch, Bash
---

# UI Designer: Basecoat 1.x

Basecoat styles semantic HTML through one root class per component plus documented `data-*` and ARIA attributes. Variants and sizes are attributes, never extra classes: `class="btn" data-variant="outline"`, not `btn-outline`.

## Source of truth

The full docs for every component live in one file: https://basecoatui.com/llms-full.txt. Before writing markup for a component not covered below, pull its section instead of guessing:

```bash
curl -s https://basecoatui.com/llms-full.txt | python -c "import sys,re; t=sys.stdin.read(); name=sys.argv[1]; m=re.search(r'(?ms)^# '+re.escape(name)+r'\n.*?(?=^# |\Z)', t); print(m.group(0) if m else 'not found')" "Dropdown Menu"
```

Section names match the component list at https://basecoatui.com/llms.txt, for example `Tabs`, `Select`, `Combobox`, `Toast`, `Sidebar`.

## Setup

**CDN** (static pages, prototypes):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/basecoat-css@1.0.2/dist/basecoat.cdn.min.css">
<script src="https://cdn.jsdelivr.net/npm/basecoat-css@1.0.2/dist/js/all.min.js" defer></script>
<!-- layout utilities such as grid, gap-4, p-8, w-full; the Basecoat CDN file does not ship them -->
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
```

Check the latest version on npm (`basecoat-css`) before pinning. Skip `all.min.js` when the page uses no JavaScript components.

**npm** (projects with a Tailwind 4 build):

```css
@import "tailwindcss";
@import "basecoat-css";
```

Pre-1.0 class names (`btn-primary`, `card-header`, `badge-secondary`) only work with `basecoat-css/compat` loaded after Basecoat. Migrate old markup instead of relying on it.

## Core components

| Component | Markup | Attributes |
|---|---|---|
| Button | `<button type="button" class="btn">` (also on `<a>`) | `data-variant`: `secondary`, `outline`, `ghost`, `link`, `destructive`; omit for primary. `data-size`: `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`. Icon-only buttons need `aria-label` |
| Card | `<div class="card">` with `<header>` (`<h2>`, `<p>`, optional `<div class="card-action">`), `<section>`, `<footer>` | `data-size="sm"` for dense cards |
| Field | `<div role="group" class="field">` with `<label>`, control, `<p>` help text | `data-invalid` on the field plus `aria-invalid="true"` on the control; `data-orientation="horizontal"` for checkbox or switch rows |
| Fieldset | `<fieldset class="fieldset">` with `<legend>` and fields | |
| Input | `<input class="input">` | Automatic inside `.field`. Native `disabled`, `required` |
| Textarea | `<textarea class="textarea">` | Automatic inside `.field` |
| Native select | `<select class="select">` | Use the JS Select component only for custom option content or multi-select |
| Checkbox | `<input type="checkbox" class="input">` | |
| Switch | `<input type="checkbox" role="switch" class="input">` | `data-size="sm"` |
| Radio | `<input type="radio" name="x" class="input">` | Wrap in `<fieldset>` or `role="radiogroup"` |
| Label | `<label class="label" for="id">` | Not needed inside `.field` |
| Badge | `<span class="badge">` | `data-variant`: `secondary`, `destructive`, `outline`, `ghost` |
| Alert | `<div class="alert">` with optional `<svg>`, `<h2>`, `<section>`, `<footer>` | `data-variant="destructive"` |
| Table | `<table class="table">`, wrapped in `<div class="table-container">` for horizontal scroll | Keep dropdowns, popovers, and tooltips out of `.table-container`: its overflow clips them |
| Dialog | `<dialog class="dialog">` with inner `<div>` holding `<header>`, `<section>`, `<footer>` | Open with `showModal()`. Add `aria-labelledby` and `aria-describedby`. Close on backdrop click with `onclick="if (event.target === this) this.close()"` |

## JavaScript components

Accordion, Combobox, Command, Drawer, Dropdown Menu, Popover, Select, Sidebar, Slider, Tabs, and Toast need Basecoat's scripts. Use the bundled behavior and never hand-roll replacements. Pull the component's section from `llms-full.txt` for its exact markup.

After inserting HTML dynamically, for example an HTMX swap, call `window.basecoat.initAll()`. After restoring cached DOM, call `window.basecoat.initAll({ force: true })`.

## Example

```html
<div class="card max-w-md">
  <header>
    <h2>Sign in</h2>
    <p>Use your work email.</p>
  </header>
  <section>
    <form class="grid gap-4">
      <div role="group" class="field">
        <label for="email">Email</label>
        <input id="email" type="email" required>
      </div>
      <div role="group" class="field">
        <label for="password">Password</label>
        <input id="password" type="password" required>
      </div>
      <button type="submit" class="btn w-full">Sign in</button>
    </form>
  </section>
</div>
```

## Principles

- Native elements first: `<dialog>`, `<details>`, `<fieldset>`, `<select>`.
- State through native attributes and ARIA: `disabled`, `checked`, `aria-invalid`, `aria-selected`.
- Icons are not bundled. Use inline Lucide SVGs or the project's icon set.
