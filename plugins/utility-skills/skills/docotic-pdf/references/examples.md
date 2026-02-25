# Docotic.Pdf Code Examples

## Table of Contents
- [Page Object Filtering & Redraw](#page-object-filtering--redraw)
- [Recursive XObject Processing](#recursive-xobject-processing)
- [Parallel Processing Pattern](#parallel-processing-pattern)
- [Region Text Extraction](#region-text-extraction)
- [HtmlToPdf with RazorLight](#htmltopdf-with-razorlight)
- [Barcode Generation](#barcode-generation)
- [Page Region to Image](#page-region-to-image)
- [Watermark Patterns](#watermark-patterns)
- [Form Operations](#form-operations)

## Page Object Filtering & Redraw

Pattern for removing/replacing specific elements (e.g., address block replacement):

```csharp
/// <summary>
/// Removes all page objects within target rectangle and redraws rest.
/// </summary>
public static void ReplaceRegion(PdfPage page, PdfRectangle targetRect, Action<PdfCanvas> drawReplacement)
{
    var options = new PdfObjectExtractionOptions();
    var objects = page.GetObjects(options).ToList();
    
    page.Canvas.Clear();
    
    foreach (var obj in objects)
    {
        if (ObjectIntersectsRect(obj, targetRect))
            continue;
            
        RedrawObject(page.Canvas, obj, options);
    }
    
    drawReplacement(page.Canvas);
}

/// <summary>
/// Checks if object bounds intersect with rectangle.
/// </summary>
private static bool ObjectIntersectsRect(PdfPageObject obj, PdfRectangle rect)
{
    var bounds = GetObjectBounds(obj);
    return bounds.IntersectsWith(rect);
}

/// <summary>
/// Gets bounding box for any page object type.
/// </summary>
private static PdfRectangle GetObjectBounds(PdfPageObject obj)
{
    return obj.Type switch
    {
        PdfPageObjectType.Text => ((PdfTextData)obj).Bounds,
        PdfPageObjectType.Image => ((PdfPaintedImage)obj).Bounds,
        PdfPageObjectType.Path => ((PdfPath)obj).GetBoundingBox(),
        PdfPageObjectType.XObject => ((PdfPaintedXObject)obj).Bounds,
        _ => PdfRectangle.Empty
    };
}
```

## Recursive XObject Processing

XObjects can contain nested content - must process recursively:

```csharp
/// <summary>
/// Redraws object to canvas, handling XObjects recursively.
/// </summary>
public static void RedrawObject(PdfCanvas canvas, PdfPageObject obj, PdfObjectExtractionOptions options)
{
    switch (obj.Type)
    {
        case PdfPageObjectType.Text:
            RedrawText(canvas, (PdfTextData)obj);
            break;
            
        case PdfPageObjectType.Image:
            RedrawImage(canvas, (PdfPaintedImage)obj);
            break;
            
        case PdfPageObjectType.Path:
            RedrawPath(canvas, (PdfPath)obj);
            break;
            
        case PdfPageObjectType.XObject:
            var paintedXObject = (PdfPaintedXObject)obj;
            var nestedObjects = paintedXObject.XObject.GetObjects(options);
            foreach (var nested in nestedObjects)
            {
                RedrawObject(canvas, nested, options);
            }
            break;
    }
}

/// <summary>
/// Redraws text chunk preserving font and position.
/// </summary>
private static void RedrawText(PdfCanvas canvas, PdfTextData textData)
{
    canvas.Font = textData.Font;
    canvas.FontSize = textData.FontSize;
    canvas.Brush.Color = textData.BrushColor;
    canvas.DrawString(textData.Position.X, textData.Position.Y, textData.GetText());
}
```

## Parallel Processing Pattern

Complete pattern for parallel PDF processing:

```csharp
/// <summary>
/// Processes large PDF in parallel chunks.
/// </summary>
public static async Task<PdfDocument> ProcessParallel(
    string inputPath, 
    int pagesPerChunk,
    Action<PdfDocument> processChunk)
{
    using var source = new PdfDocument(inputPath);
    var pageCount = source.PageCount;
    var chunks = Enumerable.Range(0, pageCount)
        .Chunk(pagesPerChunk)
        .ToList();
    
    var tasks = chunks.Select(async (pageIndices, index) =>
    {
        return await Task.Run(() =>
        {
            using var chunkDoc = source.CopyPages(pageIndices);
            processChunk(chunkDoc);
            
            var ms = new MemoryStream();
            chunkDoc.Save(ms);
            ms.Position = 0;
            return (Index: index, Stream: ms);
        });
    });
    
    var results = await Task.WhenAll(tasks);
    var ordered = results.OrderBy(r => r.Index).ToList();
    
    var final = new PdfDocument();
    foreach (var result in ordered)
    {
        final.Append(result.Stream);
        result.Stream.Dispose();
    }
    
    final.ReplaceDuplicateObjects();
    return final;
}
```

## Region Text Extraction

Extract text from specific page regions:

```csharp
/// <summary>
/// Extracts text from multiple regions on a page.
/// </summary>
public static Dictionary<string, string> ExtractRegions(
    PdfPage page, 
    Dictionary<string, PdfRectangle> regions)
{
    var results = new Dictionary<string, string>();
    
    foreach (var (name, rect) in regions)
    {
        var options = new PdfTextExtractionOptions
        {
            Rectangle = rect,
            WithFormatting = false,
            SkipInvisibleText = true
        };
        results[name] = page.GetText(options).Trim();
    }
    
    return results;
}

// Usage - invoice parsing
var regions = new Dictionary<string, PdfRectangle>
{
    ["invoiceNumber"] = new PdfRectangle(400, 50, 150, 20),
    ["date"] = new PdfRectangle(400, 75, 150, 20),
    ["total"] = new PdfRectangle(400, 500, 150, 30)
};
var extracted = ExtractRegions(pdf.Pages[0], regions);
```

## HtmlToPdf with RazorLight

Complete report generation workflow:

```csharp
/// <summary>
/// Generates PDF report from Razor template and model.
/// </summary>
public static async Task<byte[]> GenerateReport<T>(string templatePath, T model)
{
    // Setup RazorLight engine
    var engine = new RazorLightEngineBuilder()
        .UseFileSystemProject(Path.GetDirectoryName(templatePath))
        .UseMemoryCachingProvider()
        .Build();
    
    // Render HTML
    var templateName = Path.GetFileName(templatePath);
    var html = await engine.CompileRenderAsync(templateName, model);
    
    // Convert to PDF
    using var converter = await HtmlConverter.CreateAsync();
    var options = new HtmlConversionOptions
    {
        PageSize = PdfPaperSize.A4,
        PageOrientation = PdfPaperOrientation.Portrait,
        MarginTop = 20,
        MarginBottom = 20,
        MarginLeft = 15,
        MarginRight = 15
    };
    
    using var pdf = await converter.CreatePdfAsync(html, options);
    
    using var ms = new MemoryStream();
    pdf.Save(ms);
    return ms.ToArray();
}

/// <summary>
/// Converts image to base64 for inline HTML embedding.
/// </summary>
public static string ImageToBase64(byte[] imageBytes, string mimeType = "image/png")
{
    var base64 = Convert.ToBase64String(imageBytes);
    return $"data:{mimeType};base64,{base64}";
}
```

## Barcode Generation

Integrating ZXing with Docotic:

```csharp
/// <summary>
/// Generates QR code and adds to PDF page.
/// </summary>
public static void AddQrCode(PdfDocument pdf, PdfPage page, string content, double x, double y, double size)
{
    var writer = new BarcodeWriterPixelData
    {
        Format = BarcodeFormat.QR_CODE,
        Options = new QrCodeEncodingOptions
        {
            Width = (int)size,
            Height = (int)size,
            Margin = 0
        }
    };
    
    var pixelData = writer.Write(content);
    
    // Convert to bitmap bytes
    using var bitmap = new System.Drawing.Bitmap(
        pixelData.Width, 
        pixelData.Height, 
        System.Drawing.Imaging.PixelFormat.Format32bppRgb);
    
    var bitmapData = bitmap.LockBits(
        new System.Drawing.Rectangle(0, 0, pixelData.Width, pixelData.Height),
        System.Drawing.Imaging.ImageLockMode.WriteOnly,
        System.Drawing.Imaging.PixelFormat.Format32bppRgb);
    
    System.Runtime.InteropServices.Marshal.Copy(
        pixelData.Pixels, 0, bitmapData.Scan0, pixelData.Pixels.Length);
    bitmap.UnlockBits(bitmapData);
    
    using var ms = new MemoryStream();
    bitmap.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
    ms.Position = 0;
    
    var image = pdf.CreateImage(ms);
    page.Canvas.DrawImage(image, x, y, size, size, 0);
}
```

## Page Region to Image

Render specific region of page:

```csharp
/// <summary>
/// Renders page region to image bytes.
/// </summary>
public static byte[] RenderRegion(PdfPage page, PdfRectangle region, int dpi = 150)
{
    // Create XObject from page
    var pdf = page.Document;
    var xobj = pdf.CreateXObject(page);
    
    // Create new page sized to region
    var tempDoc = new PdfDocument();
    var tempPage = tempDoc.Pages[0];
    tempPage.Width = region.Width;
    tempPage.Height = region.Height;
    
    // Draw XObject offset to show only region
    tempPage.Canvas.DrawXObject(xobj, -region.Left, -region.Top);
    
    // Render
    var options = new PdfDrawOptions
    {
        HorizontalResolution = dpi,
        VerticalResolution = dpi,
        BackgroundColor = new PdfRgbColor(255, 255, 255)
    };
    
    using var ms = new MemoryStream();
    tempPage.Save(ms, options);
    return ms.ToArray();
}
```

## Watermark Patterns

Various watermark styles:

```csharp
/// <summary>
/// Adds diagonal text watermark to all pages.
/// </summary>
public static void AddDiagonalWatermark(PdfDocument pdf, string text, double opacity = 0.3)
{
    var page = pdf.Pages[0];
    var watermark = pdf.CreateXObject(page.Width, page.Height);
    watermark.DrawOnBackground = false;
    
    var canvas = watermark.Canvas;
    canvas.TextRenderingMode = PdfTextRenderingMode.FillStroke;
    canvas.Brush.Color = new PdfRgbColor(200, 200, 200);
    canvas.Brush.Opacity = opacity;
    canvas.Pen = new PdfPen(new PdfRgbColor(180, 180, 180), 0.5);
    canvas.Pen.Opacity = opacity;
    canvas.Font = pdf.CreateFont("Arial");
    canvas.FontSize = 72;
    
    var textWidth = canvas.MeasureText(text).Width;
    canvas.TranslateTransform(page.Width / 2, page.Height / 2);
    canvas.RotateTransform(-45);
    canvas.DrawString(-textWidth / 2, 0, text);
    
    foreach (var p in pdf.Pages)
    {
        p.Canvas.DrawXObject(watermark, 0, 0);
    }
}

/// <summary>
/// Adds image watermark (logo) to corner of all pages.
/// </summary>
public static void AddLogoWatermark(PdfDocument pdf, byte[] logoBytes, double opacity = 0.5)
{
    using var logoStream = new MemoryStream(logoBytes);
    var logo = pdf.CreateImage(logoStream);
    
    foreach (var page in pdf.Pages)
    {
        page.Canvas.SaveState();
        page.Canvas.Brush.Opacity = opacity;
        
        var logoWidth = 100;
        var logoHeight = logo.Height * (logoWidth / (double)logo.Width);
        var x = page.Width - logoWidth - 20;
        var y = page.Height - logoHeight - 20;
        
        page.Canvas.DrawImage(logo, x, y, logoWidth, logoHeight, 0);
        page.Canvas.RestoreState();
    }
}
```

## Form Operations

Working with PDF forms:

```csharp
/// <summary>
/// Fills form fields from dictionary.
/// </summary>
public static void FillForm(PdfDocument pdf, Dictionary<string, object> values)
{
    foreach (var control in pdf.GetControls())
    {
        if (!values.TryGetValue(control.Name, out var value))
            continue;
            
        switch (control)
        {
            case PdfTextBox textBox:
                textBox.Text = value?.ToString() ?? "";
                break;
                
            case PdfCheckBox checkBox:
                checkBox.Checked = value is bool b && b;
                break;
                
            case PdfRadioButton radio:
                radio.Checked = value is bool rb && rb;
                break;
                
            case PdfComboBox combo:
                combo.SelectedItem = value?.ToString();
                break;
                
            case PdfListBox listBox:
                if (value is IEnumerable<string> items)
                {
                    foreach (var item in items)
                        listBox.SelectedItems.Add(item);
                }
                break;
        }
    }
}

/// <summary>
/// Extracts all form field values.
/// </summary>
public static Dictionary<string, object> ExtractFormValues(PdfDocument pdf)
{
    var result = new Dictionary<string, object>();
    
    foreach (var control in pdf.GetControls())
    {
        object value = control switch
        {
            PdfTextBox tb => tb.Text,
            PdfCheckBox cb => cb.Checked,
            PdfRadioButton rb => rb.Checked,
            PdfComboBox combo => combo.SelectedItem,
            PdfListBox lb => lb.SelectedItems.ToList(),
            PdfSignatureField sf => sf.Signature?.SignerName,
            _ => null
        };
        
        if (value != null)
            result[control.Name] = value;
    }
    
    return result;
}

/// <summary>
/// Flattens form fields to make them uneditable.
/// </summary>
public static void FlattenForm(PdfDocument pdf)
{
    pdf.FlattenControls();
}
```
