---
name: docotic-pdf
description: Guide for working with BitMiracle Docotic.Pdf library in C#/.NET. Use when creating, editing, merging, splitting PDFs, extracting text/images, filling forms, adding watermarks, rendering pages to images, or any PDF manipulation task using Docotic.Pdf. Covers library quirks, threading patterns, page object manipulation, and report generation strategies.
---

# Docotic.Pdf Library Skill

## Quick Start

```csharp
// Always set license before using
BitMiracle.Docotic.LicenseManager.AddLicenseData("YOUR_LICENSE_KEY");

using var pdf = new PdfDocument();
var page = pdf.Pages[0];
page.Canvas.DrawString(20, 20, "Hello!");
pdf.Save("output.pdf");
```

## Critical: Coordinate System

**Origin (0,0) is TOP-LEFT, Y increases downward.** Unlike many PDF libraries where origin is bottom-left.

```csharp
// Draw at top-left corner
page.Canvas.DrawString(10, 10, "Top left");  
// Draw lower on page (larger Y = further down)
page.Canvas.DrawString(10, 100, "Below");
```

## Critical: Use Page.Resolution for Unit Conversion

**Never hardcode 72 or 96 DPI.** Use `page.Resolution` for converting between PDF units and inches/pixels.

```csharp
var resolution = page.Resolution; // Get actual resolution

// Convert inches to PDF units
double pdfUnits = inches * resolution;

// Convert PDF units to inches
double inches = pdfUnits / resolution;

// Example: position at 1 inch from top-left
double x = 1.0 * page.Resolution;
double y = 1.0 * page.Resolution;
page.Canvas.DrawString(x, y, "1 inch from corner");
```

## Documentation & Samples

- **API Reference**: https://api.docotic.com/bitmiracle-docotic-pdf
- **Samples Repository**: https://github.com/BitMiracle/Docotic.Pdf.Samples
- **Always check samples before reimplementing** - many operations have existing examples (matrix ops, page manipulation, etc.)

## NuGet Packages

```xml
<!-- Core library - always get latest -->
<PackageReference Include="BitMiracle.Docotic.Pdf" Version="9.*" />

<!-- HTML to PDF (free add-on, uses Chromium) -->
<PackageReference Include="BitMiracle.Docotic.Pdf.HtmlToPdf" Version="9.*" />

<!-- Layout add-on for fluent report generation -->
<PackageReference Include="BitMiracle.Docotic.Pdf.Layout" Version="9.*" />

<!-- GDI+ support (Windows only, use sparingly) -->
<PackageReference Include="BitMiracle.Docotic.Pdf.Gdi" Version="9.*" />
```

## Key Patterns & Gotchas

### Page Element Manipulation - All or Nothing

**No direct element removal.** To modify page content:

1. **Combine into XObject** - wrap existing content, draw modified version
2. **Clear and redraw** - `page.Canvas.Clear()` removes everything
3. **Selective redraw** - scan all elements recursively, redraw only what you want

```csharp
// Pattern: Replace content at specific location
var page = pdf.Pages[0];
var options = new PdfObjectExtractionOptions();
var objects = page.GetObjects(options);

// Create new page or clear existing
page.Canvas.Clear();

foreach (var obj in objects)
{
    // Skip objects in target rectangle
    if (IsInTargetArea(obj)) continue;
    
    // Redraw everything else (recursive for XObjects)
    RedrawObject(page.Canvas, obj);
}

// Draw replacement content
page.Canvas.DrawString(targetX, targetY, "New text");
```

### Font Management

```csharp
// Modern way to add fonts
var font = pdf.CreateFont("Arial");
page.Canvas.Font = font;

// Or from file
var customFont = pdf.CreateFont("/path/to/font.ttf");
```

### Threading - PdfDocument is NOT Thread-Safe

**Parallelization pattern**: Copy pages to separate documents, process in parallel, merge results.

```csharp
// Split work across threads
var tasks = new List<Task<MemoryStream>>();
var pageChunks = pages.Chunk(pagesPerThread);

foreach (var chunk in pageChunks)
{
    tasks.Add(Task.Run(() =>
    {
        using var chunkDoc = originalDoc.CopyPages(chunk);
        ProcessPages(chunkDoc);
        var ms = new MemoryStream();
        chunkDoc.Save(ms);
        ms.Position = 0;
        return ms;
    }));
}

var results = await Task.WhenAll(tasks);

// Merge in order
using var final = new PdfDocument();
foreach (var ms in results)
{
    final.Append(ms);
    ms.Dispose();
}
```

### Stream Management

- `Save(stream)` does NOT dispose the stream
- `PdfDocument` constructor may hold reference to input stream
- For safety: use `MemoryStream` for intermediate work, copy if needed for long-lived references

### PDF Report Generation Strategy

**Recommended**: Use HtmlToPdf add-on with RazorLight/RazorLite for templating. **Avoid** direct canvas drawing for complex layouts.

```csharp
// 1. Generate HTML with RazorLight
var engine = new RazorLightEngineBuilder()
    .UseFileSystemProject("/templates")
    .Build();
var html = await engine.CompileRenderAsync("Report.cshtml", model);

// 2. Convert to PDF
using var converter = await HtmlConverter.CreateAsync();
using var pdf = await converter.CreatePdfAsync(html);
pdf.Save("report.pdf");
```

**For images in HTML reports**: Use base64 inline encoding:
```html
<img src="data:image/png;base64,{base64Data}" />
```

### Barcode Generation

Docotic.Pdf has **no built-in barcode support**. Use ZXing:

```xml
<PackageReference Include="ZXing.Net" Version="0.*" />
<PackageReference Include="ZXing.Net.Bindings.Windows.Compatibility" Version="0.*" />
```

```csharp
var writer = new BarcodeWriterPixelData
{
    Format = BarcodeFormat.QR_CODE,
    Options = new QrCodeEncodingOptions { Width = 200, Height = 200 }
};
var pixelData = writer.Write("content");
// Convert to image, add to PDF
```

### Text Extraction

```csharp
// Simple extraction
string text = page.GetText();

// From specific region
var options = new PdfTextExtractionOptions
{
    Rectangle = new PdfRectangle(x, y, width, height),
    WithFormatting = false
};
string regionText = page.GetText(options);

// Detailed text data (position, font, color)
var textData = page.Canvas.GetTextData();
foreach (var chunk in textData)
{
    var text = chunk.GetText();
    var bounds = chunk.Bounds;
    var font = chunk.Font;
}
```

### Rendering Page Regions to Image

```csharp
// Render full page
var drawOptions = new PdfDrawOptions
{
    BackgroundColor = new PdfRgbColor(255, 255, 255),
    HorizontalResolution = 150,
    VerticalResolution = 150
};
page.Save("page.png", drawOptions);

// For clipped region: create XObject from page, clip, render
```

### Form Filling

```csharp
foreach (var control in pdf.GetControls())
{
    if (control is PdfTextBox textBox)
        textBox.Text = "Value";
    else if (control is PdfCheckBox checkBox)
        checkBox.Checked = true;
}
```

### Watermarks

```csharp
// Diagonal text watermark
var watermark = pdf.CreateXObject(page.Width, page.Height);
watermark.DrawOnBackground = false;

var canvas = watermark.Canvas;
canvas.TextRenderingMode = PdfTextRenderingMode.Stroke;
canvas.Pen = new PdfPen(new PdfRgbColor(200, 200, 200), 0.5);
canvas.Font = pdf.CreateFont("Arial");
canvas.FontSize = 72;

// Rotate and draw
canvas.TranslateTransform(page.Width / 2, page.Height / 2);
canvas.RotateTransform(-45);
canvas.DrawString(-canvas.MeasureText("DRAFT").Width / 2, 0, "DRAFT");

// Apply to all pages
foreach (var p in pdf.Pages)
    p.Canvas.DrawXObject(watermark, 0, 0);
```

### Custom Dictionary Elements

Access low-level PDF structure via `CosDictionary`:

```csharp
var pageDict = page.Dictionary;
pageDict["CustomKey"] = new CosString("CustomValue");
```

### Merge & Split

```csharp
// Merge
using var merged = new PdfDocument("first.pdf");
merged.Append("second.pdf");
merged.ReplaceDuplicateObjects(); // Optimize duplicates
merged.Save("merged.pdf");

// Split
using var splitted = pdf.CopyPages(0, 5); // Pages 0-5
splitted.Save("first_five.pdf");
```

## Common Exceptions

- `CannotDecryptPdfException` - wrong password or encryption issue
- `IncorrectPasswordException` - PDF requires password
- `FontNotFoundException` - font not available, use `CreateFont()` with file path
- `UnsupportedImageException` - image format not supported

## See Also

- [references/examples.md](references/examples.md) - Code patterns for common operations
