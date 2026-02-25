# Mermaid-CLI Options Reference

Common command-line options for `@mermaid-js/mermaid-cli` (mmdc).

## Basic Usage

```bash
npx -y @mermaid-js/mermaid-cli -i input.mmd -o output.svg
```

## Essential Options

### Input/Output

- `-i, --input <file>` - Input mermaid file (required)
- `-o, --output <file>` - Output file (auto-detects format from extension)
- `-p, --parseMMDOptions <json>` - Parse options from JSON

**Example:**
```bash
npx -y @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.svg
```

### Output Formats

Determined by output file extension:
- `.svg` - SVG vector graphic (recommended)
- `.png` - PNG raster image
- `.pdf` - PDF document

**Example:**
```bash
npx -y @mermaid-js/mermaid-cli -i flow.mmd -o flow.svg
npx -y @mermaid-js/mermaid-cli -i flow.mmd -o flow.png
npx -y @mermaid-js/mermaid-cli -i flow.mmd -o flow.pdf
```

## Styling Options

### Theme

- `-t, --theme <theme>` - Theme to use
  - `default` - Default theme
  - `forest` - Green forest theme
  - `dark` - Dark theme
  - `neutral` - Neutral gray theme
  - `base` - Base theme for customization

**Example:**
```bash
npx -y @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.png -t dark
```

### Background Color

- `-b, --backgroundColor <color>` - Background color (default: white)
  - Supports: hex (#ffffff), rgb (rgb(255,255,255)), named colors (transparent)

**Example:**
```bash
npx -y @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.png -b transparent
```

### Width/Scale

- `-w, --width <pixels>` - Width of the output image
- `-H, --height <pixels>` - Height of the output image
- `-s, --scale <number>` - Scale factor for rendering (default: 1)

**Example:**
```bash
npx -y @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.png -w 1920 -s 2
```

## Configuration File

### Using Config File

- `-c, --configFile <file>` - JSON configuration file

**Config file example (`mermaid-config.json`):**
```json
{
  "theme": "dark",
  "themeVariables": {
    "primaryColor": "#BB2528",
    "primaryTextColor": "#fff",
    "primaryBorderColor": "#7C0000",
    "lineColor": "#F8B229",
    "secondaryColor": "#006100",
    "tertiaryColor": "#fff"
  },
  "flowchart": {
    "curve": "basis",
    "htmlLabels": true
  }
}
```

**Usage:**
```bash
npx -y @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.png -c mermaid-config.json
```

## CSS Styling

- `--cssFile <file>` - CSS file for additional styling

**CSS file example (`custom.css`):**
```css
.node rect {
  fill: #2196F3;
  stroke: #1976D2;
  stroke-width: 2px;
}

.node text {
  fill: white;
  font-family: 'Segoe UI', Arial, sans-serif;
}
```

**Usage:**
```bash
npx -y @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.png --cssFile custom.css
```

## Batch Processing

### Process Multiple Files (PowerShell)

```powershell
Get-ChildItem *.mmd | ForEach-Object {
  npx -y @mermaid-js/mermaid-cli -i $_.Name -o "$($_.BaseName).svg"
}
```

## Puppeteer Options

### Browser Configuration

- `--puppeteerConfigFile <file>` - Puppeteer configuration JSON

**Puppeteer config example (`puppeteer-config.json`):**
```json
{
  "args": ["--no-sandbox", "--disable-setuid-sandbox"],
  "headless": true
}
```

Useful for CI/CD environments or when running in containers.

## Common Workflows

### Standard (SVG)
```bash
npx -y @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.svg
```

### Dark Theme
```bash
npx -y @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.svg -t dark
```

### Transparent Background
```bash
npx -y @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.svg -b transparent
```

### High-DPI PNG (for presentations)
```bash
npx -y @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.png -w 3840 -s 2
```

### Print-Ready PDF
```bash
npx -y @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.pdf -w 2480
```

## Troubleshooting

### Common Issues

**Puppeteer Installation Failed:**
- Use `npx -y` to auto-install dependencies
- Check Node.js version (requires 16+)

**Diagram Too Large:**
- Increase width: `-w 4000`
- Increase scale: `-s 2`

**Font Rendering Issues on Windows:**
- Install Chromium fonts or use web-safe fonts in config

**Transparent Background Not Working:**
- Use `-b transparent` and output to PNG or SVG (not PDF)

**Configuration Not Applied:**
- Verify JSON syntax in config file
- Use absolute paths for config files on Windows

## Additional Resources

- [Mermaid Live Editor](https://mermaid.live/) - Test diagrams online
- [Mermaid Documentation](https://mermaid.js.org/) - Full syntax reference
- [GitHub Issues](https://github.com/mermaid-js/mermaid-cli/issues) - Report bugs
