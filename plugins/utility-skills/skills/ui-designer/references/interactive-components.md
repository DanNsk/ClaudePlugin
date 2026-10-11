# Interactive Components

Components requiring JavaScript. Use vanilla JS with native HTML APIs.

## Tabs

Uses ARIA attributes for state. JavaScript handles `aria-selected` and panel visibility.

```html
<div class="tabs" data-tabs>
  <div class="tabs-list" role="tablist">
    <button class="tabs-trigger" role="tab" aria-selected="true" data-tab="account">
      Account
    </button>
    <button class="tabs-trigger" role="tab" aria-selected="false" data-tab="password">
      Password
    </button>
    <button class="tabs-trigger" role="tab" aria-selected="false" data-tab="settings">
      Settings
    </button>
  </div>

  <div class="tabs-content" role="tabpanel" data-panel="account">
    <h3>Account Settings</h3>
    <p>Manage your account details here.</p>
  </div>

  <div class="tabs-content hidden" role="tabpanel" data-panel="password">
    <h3>Change Password</h3>
    <p>Update your password here.</p>
  </div>

  <div class="tabs-content hidden" role="tabpanel" data-panel="settings">
    <h3>Preferences</h3>
    <p>Configure your preferences.</p>
  </div>
</div>

<script>
document.querySelectorAll('[data-tabs]').forEach(tabs => {
  const triggers = tabs.querySelectorAll('[role="tab"]');
  const panels = tabs.querySelectorAll('[role="tabpanel"]');

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const tabId = trigger.dataset.tab;

      // Update triggers
      triggers.forEach(t => t.setAttribute('aria-selected', 'false'));
      trigger.setAttribute('aria-selected', 'true');

      // Update panels
      panels.forEach(p => {
        p.classList.toggle('hidden', p.dataset.panel !== tabId);
      });
    });
  });
});
</script>
```

## Dialog / Modal

Uses native `<dialog>` element with `showModal()` and `close()`.

```html
<button class="btn" onclick="document.getElementById('my-dialog').showModal()">
  Open Dialog
</button>

<dialog id="my-dialog" class="dialog">
  <div class="dialog-content">
    <div class="dialog-header">
      <h2 class="dialog-title">Confirm Action</h2>
      <p class="dialog-description">Are you sure you want to proceed?</p>
    </div>

    <div class="dialog-body">
      <p>This action cannot be undone.</p>
    </div>

    <div class="dialog-footer">
      <button class="btn btn-outline" onclick="this.closest('dialog').close()">
        Cancel
      </button>
      <button class="btn btn-primary" onclick="confirmAction()">
        Confirm
      </button>
    </div>
  </div>
</dialog>

<script>
// Close on backdrop click
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
});

function confirmAction() {
  // Your action here
  document.getElementById('my-dialog').close();
}
</script>
```

### Dialog with Form

```html
<dialog id="edit-dialog" class="dialog">
  <form method="dialog" class="dialog-content">
    <div class="dialog-header">
      <h2 class="dialog-title">Edit Profile</h2>
    </div>

    <div class="dialog-body form">
      <fieldset>
        <label for="dialog-name">Name</label>
        <input type="text" id="dialog-name" class="input" required>
      </fieldset>
      <fieldset>
        <label for="dialog-email">Email</label>
        <input type="email" id="dialog-email" class="input" required>
      </fieldset>
    </div>

    <div class="dialog-footer">
      <button type="button" class="btn btn-outline" onclick="this.closest('dialog').close()">
        Cancel
      </button>
      <button type="submit" class="btn btn-primary">Save</button>
    </div>
  </form>
</dialog>
```

## Dropdown Menu

Uses focus management and keyboard navigation.

```html
<div class="dropdown" data-dropdown>
  <button class="btn" data-dropdown-trigger aria-expanded="false" aria-haspopup="true">
    Options
    <svg class="ml-2 h-4 w-4"><!-- chevron icon --></svg>
  </button>

  <div class="dropdown-content hidden" role="menu">
    <button class="dropdown-item" role="menuitem">Edit</button>
    <button class="dropdown-item" role="menuitem">Duplicate</button>
    <div class="dropdown-separator"></div>
    <button class="dropdown-item dropdown-item-destructive" role="menuitem">Delete</button>
  </div>
</div>

<script>
document.querySelectorAll('[data-dropdown]').forEach(dropdown => {
  const trigger = dropdown.querySelector('[data-dropdown-trigger]');
  const content = dropdown.querySelector('.dropdown-content');

  trigger.addEventListener('click', () => {
    const isOpen = !content.classList.contains('hidden');
    content.classList.toggle('hidden');
    trigger.setAttribute('aria-expanded', !isOpen);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      content.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  // Keyboard navigation
  dropdown.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      content.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  });
});
</script>
```

## Select (Custom)

For custom styling beyond native `<select>`. Uses listbox pattern.

```html
<div class="select-custom" data-select>
  <button class="select-trigger" aria-haspopup="listbox" aria-expanded="false">
    <span data-select-value>Select option...</span>
    <svg class="h-4 w-4"><!-- chevron icon --></svg>
  </button>

  <ul class="select-content hidden" role="listbox">
    <li class="select-item" role="option" data-value="apple">Apple</li>
    <li class="select-item" role="option" data-value="banana">Banana</li>
    <li class="select-item" role="option" data-value="orange">Orange</li>
  </ul>

  <input type="hidden" name="fruit" data-select-input>
</div>

<script>
document.querySelectorAll('[data-select]').forEach(select => {
  const trigger = select.querySelector('.select-trigger');
  const content = select.querySelector('.select-content');
  const valueDisplay = select.querySelector('[data-select-value]');
  const hiddenInput = select.querySelector('[data-select-input]');
  const items = select.querySelectorAll('[role="option"]');

  trigger.addEventListener('click', () => {
    const isOpen = !content.classList.contains('hidden');
    content.classList.toggle('hidden');
    trigger.setAttribute('aria-expanded', !isOpen);
  });

  items.forEach(item => {
    item.addEventListener('click', () => {
      const value = item.dataset.value;
      valueDisplay.textContent = item.textContent;
      hiddenInput.value = value;

      // Update aria-selected
      items.forEach(i => i.setAttribute('aria-selected', 'false'));
      item.setAttribute('aria-selected', 'true');

      content.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!select.contains(e.target)) {
      content.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
});
</script>
```

**Prefer native `<select>` when possible** - custom selects are only needed for complex styling requirements.

## Popover

Similar to dropdown but for content display.

```html
<div class="popover" data-popover>
  <button class="btn btn-outline" data-popover-trigger>
    <svg class="h-4 w-4"><!-- info icon --></svg>
  </button>

  <div class="popover-content hidden" data-popover-content>
    <h4 class="font-medium">Information</h4>
    <p class="text-sm text-muted-foreground">
      This is additional context about the feature.
    </p>
  </div>
</div>

<script>
document.querySelectorAll('[data-popover]').forEach(popover => {
  const trigger = popover.querySelector('[data-popover-trigger]');
  const content = popover.querySelector('[data-popover-content]');

  trigger.addEventListener('click', () => {
    content.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target)) {
      content.classList.add('hidden');
    }
  });
});
</script>
```

## Toast Notifications

Container-based notifications with auto-dismiss.

```html
<div id="toast-container" class="toast-container"></div>

<script>
function showToast(message, type = 'default', duration = 3000) {
  const container = document.getElementById('toast-container');

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <p>${message}</p>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg class="h-4 w-4"><!-- x icon --></svg>
    </button>
  `;

  container.appendChild(toast);

  // Auto dismiss
  setTimeout(() => {
    toast.classList.add('toast-leaving');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Usage:
// showToast('Changes saved!', 'success');
// showToast('Something went wrong', 'error');
// showToast('Please wait...', 'default', 5000);
</script>

<style>
.toast-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 50;
}
</style>
```

## Sidebar

Collapsible sidebar with toggle.

```html
<div class="layout" data-sidebar-layout>
  <aside class="sidebar" data-sidebar>
    <div class="sidebar-header">
      <h2>App Name</h2>
      <button class="btn btn-ghost btn-icon" data-sidebar-toggle>
        <svg class="h-4 w-4"><!-- menu icon --></svg>
      </button>
    </div>

    <nav class="sidebar-nav">
      <a href="#" class="sidebar-item sidebar-item-active">Dashboard</a>
      <a href="#" class="sidebar-item">Settings</a>
      <a href="#" class="sidebar-item">Profile</a>
    </nav>
  </aside>

  <main class="main-content">
    <!-- Page content -->
  </main>
</div>

<script>
document.querySelectorAll('[data-sidebar-toggle]').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const layout = toggle.closest('[data-sidebar-layout]');
    const sidebar = layout.querySelector('[data-sidebar]');
    sidebar.classList.toggle('sidebar-collapsed');
  });
});
</script>
```

## Command Palette

Search-driven command interface.

```html
<dialog id="command-palette" class="dialog command-palette">
  <div class="command-content">
    <div class="command-input-wrapper">
      <svg class="h-4 w-4"><!-- search icon --></svg>
      <input type="text" class="command-input" placeholder="Type a command or search..." autofocus>
    </div>

    <div class="command-list">
      <div class="command-group">
        <p class="command-group-heading">Actions</p>
        <button class="command-item">
          <svg class="h-4 w-4 mr-2"><!-- icon --></svg>
          New File
          <span class="command-shortcut">Ctrl+N</span>
        </button>
        <button class="command-item">
          <svg class="h-4 w-4 mr-2"><!-- icon --></svg>
          Save
          <span class="command-shortcut">Ctrl+S</span>
        </button>
      </div>

      <div class="command-separator"></div>

      <div class="command-group">
        <p class="command-group-heading">Navigation</p>
        <button class="command-item">Go to Dashboard</button>
        <button class="command-item">Go to Settings</button>
      </div>
    </div>
  </div>
</dialog>

<script>
// Open with Ctrl+K
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('command-palette').showModal();
  }
});

// Filter commands on input
document.querySelector('.command-input').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  document.querySelectorAll('.command-item').forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(query) ? '' : 'none';
  });
});
</script>
```

## Keyboard Shortcuts

Common patterns for keyboard handling:

```javascript
// Global keyboard listener
document.addEventListener('keydown', (e) => {
  // Escape closes modals
  if (e.key === 'Escape') {
    document.querySelectorAll('dialog[open]').forEach(d => d.close());
  }

  // Ctrl+K opens command palette
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('command-palette').showModal();
  }
});

// Focus trap for modals
function trapFocus(element) {
  const focusable = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}
```
