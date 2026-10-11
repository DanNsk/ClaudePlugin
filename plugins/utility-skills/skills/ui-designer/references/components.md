# Basecoat Component Reference

CSS-only components - no JavaScript required.

## Buttons

```html
<!-- Variants -->
<button class="btn">Default</button>
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-destructive">Destructive</button>
<button class="btn btn-link">Link</button>

<!-- Sizes -->
<button class="btn btn-sm">Small</button>
<button class="btn">Default</button>
<button class="btn btn-lg">Large</button>

<!-- States -->
<button class="btn" disabled>Disabled</button>
<button class="btn btn-primary">
  <svg class="animate-spin h-4 w-4 mr-2">...</svg>
  Loading...
</button>

<!-- With icons -->
<button class="btn btn-icon"><svg>...</svg></button>
<button class="btn"><svg class="mr-2">...</svg>With Icon</button>
```

## Inputs

```html
<!-- Basic input -->
<input type="text" class="input" placeholder="Enter text">
<input type="email" class="input" placeholder="email@example.com">
<input type="password" class="input" placeholder="Password">

<!-- States -->
<input class="input" disabled placeholder="Disabled">
<input class="input" aria-invalid="true" placeholder="Error state">

<!-- With label (inside form) -->
<form class="form">
  <fieldset>
    <label for="name">Name</label>
    <input type="text" id="name" class="input">
  </fieldset>
</form>
```

## Textarea

```html
<textarea class="textarea" rows="4" placeholder="Enter description..."></textarea>
<textarea class="textarea" aria-invalid="true">Invalid state</textarea>
```

## Select (Native)

```html
<select class="select">
  <option value="">Choose option...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <option value="3">Option 3</option>
</select>
```

## Checkbox and Radio

```html
<!-- Checkbox -->
<label class="flex items-center gap-2">
  <input type="checkbox" class="checkbox">
  <span>Accept terms</span>
</label>

<!-- Radio group -->
<fieldset class="flex flex-col gap-2">
  <label class="flex items-center gap-2">
    <input type="radio" name="plan" value="free" class="radio">
    <span>Free</span>
  </label>
  <label class="flex items-center gap-2">
    <input type="radio" name="plan" value="pro" class="radio">
    <span>Pro</span>
  </label>
</fieldset>
```

## Switch/Toggle

```html
<label class="flex items-center gap-2">
  <input type="checkbox" class="switch">
  <span>Enable notifications</span>
</label>
```

## Cards

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <p class="card-description">Optional description text</p>
  </div>
  <div class="card-content">
    <p>Main card content goes here.</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-outline">Cancel</button>
    <button class="btn btn-primary">Save</button>
  </div>
</div>

<!-- Minimal card -->
<div class="card p-4">
  Simple content card
</div>
```

## Tables

```html
<div class="table-container">
  <table class="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td><span class="badge badge-success">Active</span></td>
      </tr>
      <tr>
        <td>Jane Smith</td>
        <td>jane@example.com</td>
        <td><span class="badge badge-warning">Pending</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

## Badges

```html
<span class="badge">Default</span>
<span class="badge badge-primary">Primary</span>
<span class="badge badge-secondary">Secondary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-destructive">Error</span>
<span class="badge badge-outline">Outline</span>
```

## Alerts

```html
<div class="alert">
  <p>Default alert message</p>
</div>

<div class="alert alert-success">
  <svg class="h-4 w-4">...</svg>
  <div>
    <p class="font-medium">Success!</p>
    <p>Your changes have been saved.</p>
  </div>
</div>

<div class="alert alert-warning">
  <p>Warning: This action cannot be undone.</p>
</div>

<div class="alert alert-destructive">
  <p>Error: Something went wrong.</p>
</div>
```

## Avatar

```html
<div class="avatar">
  <img src="user.jpg" alt="User name">
</div>

<div class="avatar avatar-sm">
  <img src="user.jpg" alt="User name">
</div>

<div class="avatar avatar-lg">
  <img src="user.jpg" alt="User name">
</div>

<!-- Fallback with initials -->
<div class="avatar">
  <span>JD</span>
</div>
```

## Separator

```html
<hr class="separator">

<!-- Vertical (in flex container) -->
<div class="flex items-center gap-4">
  <span>Left</span>
  <div class="separator-vertical h-6"></div>
  <span>Right</span>
</div>
```

## Skeleton (Loading)

```html
<div class="skeleton h-4 w-3/4"></div>
<div class="skeleton h-4 w-1/2 mt-2"></div>
<div class="skeleton h-32 w-full mt-4"></div>

<!-- Card skeleton -->
<div class="card">
  <div class="card-header">
    <div class="skeleton h-6 w-1/3"></div>
    <div class="skeleton h-4 w-1/2 mt-2"></div>
  </div>
  <div class="card-content">
    <div class="skeleton h-4 w-full"></div>
    <div class="skeleton h-4 w-full mt-2"></div>
    <div class="skeleton h-4 w-2/3 mt-2"></div>
  </div>
</div>
```

## Progress

```html
<div class="progress">
  <div class="progress-bar" style="width: 60%"></div>
</div>

<div class="progress">
  <div class="progress-bar progress-bar-success" style="width: 100%"></div>
</div>
```

## Accordion (CSS-only with details)

```html
<details class="accordion">
  <summary class="accordion-trigger">Section 1</summary>
  <div class="accordion-content">
    Content for section 1
  </div>
</details>

<details class="accordion">
  <summary class="accordion-trigger">Section 2</summary>
  <div class="accordion-content">
    Content for section 2
  </div>
</details>
```

## Form Layout

```html
<form class="form">
  <!-- Single field -->
  <fieldset>
    <label for="email">Email</label>
    <input type="email" id="email" class="input" required>
    <p class="text-muted-foreground text-sm">We'll never share your email.</p>
  </fieldset>

  <!-- Field with error -->
  <fieldset>
    <label for="password">Password</label>
    <input type="password" id="password" class="input" aria-invalid="true">
    <p class="text-destructive text-sm">Password is required</p>
  </fieldset>

  <!-- Inline fields -->
  <div class="grid grid-cols-2 gap-4">
    <fieldset>
      <label for="first">First Name</label>
      <input type="text" id="first" class="input">
    </fieldset>
    <fieldset>
      <label for="last">Last Name</label>
      <input type="text" id="last" class="input">
    </fieldset>
  </div>

  <!-- Actions -->
  <div class="flex justify-end gap-2">
    <button type="button" class="btn btn-outline">Cancel</button>
    <button type="submit" class="btn btn-primary">Submit</button>
  </div>
</form>
```

## Aspect Ratio

```html
<div class="aspect-video">
  <img src="video-thumbnail.jpg" class="object-cover w-full h-full">
</div>

<div class="aspect-square">
  <img src="avatar.jpg" class="object-cover w-full h-full">
</div>
```

## Scroll Area

```html
<div class="scroll-area h-48">
  <div class="p-4">
    <!-- Long scrollable content -->
  </div>
</div>
```
