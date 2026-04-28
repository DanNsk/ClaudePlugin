/* global PORT, rawPlan */
(function () {
  "use strict";

  // ---- state ----
  var annotations = [];
  var nextId = 1;
  var inCodeBlock = false;
  var inMermaidBlock = false;
  var inTable = false;

  // ---- DOM refs ----
  var contentEl = document.getElementById("content");
  var annotColEl = document.getElementById("annotationsCol");
  var actionMenu = document.getElementById("actionMenu");
  var btnComment = document.getElementById("btnComment");
  var btnDelete = document.getElementById("btnDelete");
  var annotCountEl = document.getElementById("annotationCount");
  var btnChanges = document.getElementById("btnChanges");
  var lineCountEl = document.getElementById("lineCount");

  // ---- helpers ----
  function escHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ---- inline match helpers ----
  function findClosingBracket(text, pos) {
    for (var i = pos + 1; i < text.length; i++) {
      if (text[i] === "]") return i;
    }
    return -1;
  }

  function findClosingParen(text, pos) {
    for (var i = pos + 1; i < text.length; i++) {
      if (text[i] === ")") return i;
    }
    return -1;
  }

  function matchImageAt(text, pos) {
    if (text[pos] !== "!" || text[pos + 1] !== "[") return -1;
    var cb = findClosingBracket(text, pos + 1);
    if (cb === -1 || text[cb + 1] !== "(") return -1;
    var cp = findClosingParen(text, cb + 1);
    return cp === -1 ? -1 : cp + 1;
  }

  function matchLinkAt(text, pos) {
    if (text[pos] !== "[") return -1;
    var cb = findClosingBracket(text, pos);
    if (cb === -1 || text[cb + 1] !== "(") return -1;
    var cp = findClosingParen(text, cb + 1);
    return cp === -1 ? -1 : cp + 1;
  }

  function matchBoldAt(text, pos) {
    if (text[pos] !== "*" || text[pos + 1] !== "*") return -1;
    var end = text.indexOf("**", pos + 2);
    if (end === -1 || end === pos + 2) return -1;
    return end + 2;
  }

  function matchItalicAt(text, pos) {
    if (text[pos] !== "*") return -1;
    for (var i = pos + 1; i < text.length; i++) {
      if (text[i] === "*" && text[i - 1] !== "*" && text[i + 1] !== "*") return i + 1;
    }
    return -1;
  }

  function matchCodeAt(text, pos) {
    if (text[pos] !== "`") return -1;
    var end = text.indexOf("`", pos + 1);
    return end === -1 ? -1 : end + 1;
  }

  // ---- single-pass inline tokenizer ----
  function tokenizeInline(text) {
    var tokens = [];
    var pos = 0;
    var plainStart = 0;

    function flushPlain() {
      if (pos > plainStart) {
        tokens.push({ type: "text", start: plainStart, end: pos, content: text.substring(plainStart, pos) });
      }
    }

    while (pos < text.length) {
      var end;

      // image: ![alt](url)
      if (text[pos] === "!" && (end = matchImageAt(text, pos)) !== -1) {
        flushPlain();
        var cb = findClosingBracket(text, pos + 1);
        tokens.push({
          type: "image", start: pos, end: end,
          alt: text.substring(pos + 2, cb),
          url: text.substring(cb + 2, end - 1),
          closeBracket: cb
        });
        plainStart = end;
        pos = end;
        continue;
      }

      // link: [text](url)
      if (text[pos] === "[" && (end = matchLinkAt(text, pos)) !== -1) {
        flushPlain();
        var lcb = findClosingBracket(text, pos);
        tokens.push({
          type: "link", start: pos, end: end,
          content: text.substring(pos + 1, lcb),
          url: text.substring(lcb + 2, end - 1),
          closeBracket: lcb
        });
        plainStart = end;
        pos = end;
        continue;
      }

      // bold: **text**
      if (text[pos] === "*" && text[pos + 1] === "*" && (end = matchBoldAt(text, pos)) !== -1) {
        flushPlain();
        tokens.push({
          type: "bold", start: pos, end: end,
          content: text.substring(pos + 2, end - 2)
        });
        plainStart = end;
        pos = end;
        continue;
      }

      // italic: *text* (single star, not **)
      if (text[pos] === "*" && text[pos + 1] !== "*" && (end = matchItalicAt(text, pos)) !== -1) {
        flushPlain();
        tokens.push({
          type: "italic", start: pos, end: end,
          content: text.substring(pos + 1, end - 1)
        });
        plainStart = end;
        pos = end;
        continue;
      }

      // inline code: `code`
      if (text[pos] === "`" && (end = matchCodeAt(text, pos)) !== -1) {
        flushPlain();
        tokens.push({
          type: "code", start: pos, end: end,
          content: text.substring(pos + 1, end - 1)
        });
        plainStart = end;
        pos = end;
        continue;
      }

      pos++;
    }

    if (plainStart < text.length) {
      tokens.push({ type: "text", start: plainStart, end: text.length, content: text.substring(plainStart) });
    }

    return tokens;
  }

  // ---- position-tracking inline renderer ----
  // rawOffset: 0-indexed position where text begins in the raw source line
  // data-raw-start / data-raw-end are 1-indexed column positions of visible content
  function renderInline(text, rawOffset) {
    if (rawOffset === undefined) rawOffset = 0;
    var tokens = tokenizeInline(text);
    var html = "";

    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      var rs, re;

      switch (t.type) {
        case "text":
          rs = rawOffset + t.start + 1;
          re = rawOffset + t.end;
          html += '<span data-raw-start="' + rs + '" data-raw-end="' + re + '">' + escHtml(t.content) + "</span>";
          break;
        case "bold":
          rs = rawOffset + t.start + 3;
          re = rawOffset + t.end - 2;
          html += '<strong data-raw-start="' + rs + '" data-raw-end="' + re + '">'
                + renderInline(t.content, rawOffset + t.start + 2) + "</strong>";
          break;
        case "italic":
          rs = rawOffset + t.start + 2;
          re = rawOffset + t.end - 1;
          html += '<em data-raw-start="' + rs + '" data-raw-end="' + re + '">'
                + renderInline(t.content, rawOffset + t.start + 1) + "</em>";
          break;
        case "code":
          rs = rawOffset + t.start + 2;
          re = rawOffset + t.end - 1;
          html += '<code data-raw-start="' + rs + '" data-raw-end="' + re + '">' + escHtml(t.content) + "</code>";
          break;
        case "link":
          rs = rawOffset + t.start + 2;
          re = rawOffset + t.closeBracket;
          html += '<a href="' + escHtml(t.url) + '" target="_blank" rel="noopener"'
                + ' data-raw-start="' + rs + '" data-raw-end="' + re + '">' + escHtml(t.content) + "</a>";
          break;
        case "image":
          rs = rawOffset + t.start + 3;
          re = rawOffset + t.closeBracket;
          html += '<img alt="' + escHtml(t.alt) + '" src="' + escHtml(t.url) + '"'
                + ' style="max-width:100%;max-height:200px"'
                + ' data-raw-start="' + rs + '" data-raw-end="' + re + '">';
          break;
      }
    }

    return html;
  }

  // ---- table cell position tracking ----
  function parseTableCells(raw) {
    var html = "";
    var searchPos = raw.indexOf("|") + 1;
    var cells = raw.split("|").slice(1);
    if (cells.length > 0 && cells[cells.length - 1].trim() === "") cells.pop();

    for (var c = 0; c < cells.length; c++) {
      var cellRaw = cells[c];
      var trimmed = cellRaw.trim();
      var trimLeading = cellRaw.length - cellRaw.replace(/^\s+/, "").length;
      var contentStart = searchPos + trimLeading;

      html += '<span class="table-cell" data-raw-start="' + (contentStart + 1)
            + '" data-raw-end="' + (contentStart + trimmed.length)
            + '">' + renderInline(trimmed, contentStart) + "</span>";

      searchPos += cellRaw.length + 1;
    }

    return html;
  }

  function classifyLine(raw) {
    // code fence - 1:1 mapping
    if (/^```/.test(raw)) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        if (/^```mermaid\s*$/i.test(raw)) {
          inMermaidBlock = true;
          return { cls: "code-fence mermaid-fence", html: escHtml(raw), rawOffset: 0 };
        }
        return { cls: "code-fence", html: escHtml(raw), rawOffset: 0 };
      } else {
        var wasMermaid = inMermaidBlock;
        inCodeBlock = false;
        inMermaidBlock = false;
        var fenceCls = wasMermaid ? "code-fence mermaid-fence-end" : "code-fence";
        return { cls: fenceCls, html: escHtml(raw), rawOffset: 0 };
      }
    }
    // inside code block - 1:1 mapping
    if (inCodeBlock) {
      if (inMermaidBlock) {
        return { cls: "code-block-line mermaid-src", html: escHtml(raw), raw: raw, rawOffset: 0 };
      }
      return { cls: "code-block-line", html: escHtml(raw), rawOffset: 0 };
    }
    // table rows
    if (/^\|/.test(raw)) {
      inTable = true;
      if (/^\|[\s:-]+\|/.test(raw) && /^[\s|:-]+$/.test(raw)) {
        return { cls: "table-row table-separator", html: "", rawOffset: 0 };
      }
      return { cls: "table-row", html: parseTableCells(raw), rawOffset: 0 };
    }
    if (inTable) inTable = false;

    // empty
    if (raw.trim() === "") {
      return { cls: "empty-line", html: "", rawOffset: 0 };
    }
    // horizontal rule
    if (/^(\s*[-*_]\s*){3,}$/.test(raw)) {
      return { cls: "hr-line", html: "", rawOffset: 0 };
    }
    // headings - strip prefix (## )
    var hMatch = raw.match(/^(#{1,6})\s+(.*)/);
    if (hMatch) {
      var level = hMatch[1].length;
      var hOffset = raw.indexOf(hMatch[2]);
      return { cls: "h" + level, html: renderInline(hMatch[2], hOffset), rawOffset: hOffset };
    }
    // list items - strip indent + bullet + space
    var listMatch = raw.match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
    if (listMatch) {
      var indent = listMatch[1].length;
      var bullet = /^\d/.test(listMatch[2]) ? listMatch[2] : "\u2022";
      var depthCls = "list-item";
      if (indent >= 4 && indent < 8) depthCls = "list-item list-item-2";
      else if (indent >= 8) depthCls = "list-item list-item-3";
      var bulletRawStart = indent + 1;
      var contentOffset = raw.indexOf(listMatch[3]);
      return {
        cls: depthCls,
        html: '<span style="color:var(--muted);margin-right:6px" data-raw-start="' + bulletRawStart
              + '" data-raw-end="' + bulletRawStart + '">' + escHtml(bullet) + "</span> "
              + renderInline(listMatch[3], contentOffset),
        rawOffset: contentOffset
      };
    }
    // plain text - 1:1 mapping
    return { cls: "", html: renderInline(raw, 0), rawOffset: 0 };
  }

  // ---- render lines ----
  function render() {
    var lines = rawPlan.split("\n");
    var parsed = [];
    inCodeBlock = false;
    inMermaidBlock = false;
    inTable = false;

    for (var i = 0; i < lines.length; i++) {
      parsed.push({ num: i + 1, info: classifyLine(lines[i]) });
    }

    // helper: build opening tag for a .line div with raw coordinate attributes
    function lineOpen(cls, num, rawOffset, rawLen) {
      var rs = rawOffset + 1;
      var re = rawLen;
      return '<div class="line ' + cls + '" data-line="' + num
           + '" data-raw-start="' + rs + '" data-raw-end="' + re + '">';
    }

    // Build HTML, wrapping contiguous table rows in .table-block divs
    var contentHtml = "";
    var i = 0;
    while (i < parsed.length) {
      var p = parsed[i];
      var rawLen = lines[p.num - 1].length;
      if (p.info.cls.indexOf("mermaid-fence") !== -1 && p.info.cls.indexOf("mermaid-fence-end") === -1) {
        // start a mermaid block
        var mermaidSrc = [];
        contentHtml += '<div class="mermaid-block">';
        contentHtml += lineOpen(p.info.cls, p.num, p.info.rawOffset, rawLen) + p.info.html + '</div>';
        i++;
        while (i < parsed.length && parsed[i].info.cls.indexOf("mermaid-fence-end") === -1) {
          var mp = parsed[i];
          var mpLen = lines[mp.num - 1].length;
          contentHtml += lineOpen(mp.info.cls, mp.num, mp.info.rawOffset, mpLen) + mp.info.html + '</div>';
          if (mp.info.raw !== undefined) {
            mermaidSrc.push(mp.info.raw);
          }
          i++;
        }
        if (i < parsed.length) {
          var cp = parsed[i];
          var cpLen = lines[cp.num - 1].length;
          contentHtml += lineOpen(cp.info.cls, cp.num, cp.info.rawOffset, cpLen) + cp.info.html + '</div>';
          i++;
        }
        contentHtml += '<div class="mermaid-render"><pre class="mermaid">' + escHtml(mermaidSrc.join("\n")) + '</pre></div>';
        contentHtml += '</div>';
      } else if (p.info.cls.indexOf("table-row") !== -1) {
        contentHtml += '<div class="table-block">';
        while (i < parsed.length && parsed[i].info.cls.indexOf("table-row") !== -1) {
          var tp = parsed[i];
          if (tp.info.cls.indexOf("table-separator") !== -1) {
            i++;
            continue;
          }
          var isHeader = (i + 1 < parsed.length && parsed[i + 1].info.cls.indexOf("table-separator") !== -1);
          var rowCls = tp.info.cls + (isHeader ? " table-header" : "");
          var tpLen = lines[tp.num - 1].length;
          contentHtml += '<div class="line ' + rowCls + '" data-line="' + tp.num
                       + '" data-raw-start="1" data-raw-end="' + tpLen + '">';
          contentHtml += '<span class="table-gutter">' + tp.num + '</span>';
          contentHtml += tp.info.html;
          contentHtml += '</div>';
          i++;
        }
        contentHtml += '</div>';
      } else {
        contentHtml += lineOpen(p.info.cls, p.num, p.info.rawOffset, rawLen) + p.info.html + '</div>';
        i++;
      }
    }

    // append-comment row after last line
    var lastLine = lines.length;
    contentHtml += '<div class="line add-comment-line" data-line="add" title="Add comment at end of plan">Click to add comment at end...</div>';

    contentEl.innerHTML = contentHtml;
    lineCountEl.textContent = lines.length + " lines";

    // initialize and render mermaid diagrams
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          darkMode: true,
          background: '#161b22',
          primaryColor: '#1f6feb',
          primaryTextColor: '#e6edf3',
          lineColor: '#30363d',
          textColor: '#e6edf3'
        }
      });
      // Render each diagram individually so invalid syntax fails silently.
      var mermaidEls = contentEl.querySelectorAll('.mermaid');
      for (var mi = 0; mi < mermaidEls.length; mi++) {
        (function (el, idx) {
          var container = el.parentElement;
          var src = el.textContent;
          mermaid.render('mermaid-svg-' + idx, src).then(function (result) {
            container.innerHTML = result.svg;
          }).catch(function () {
            container.style.display = 'none';
          });
        })(mermaidEls[mi], mi);
      }
    }

    highlightCodeBlocks();

    // wire up the add-comment row
    var addRow = contentEl.querySelector(".add-comment-line");
    function onAddClick() {
      var a = addAnnotation("comment", {
        startLine: lastLine,
        startCol: 1,
        endLine: lastLine,
        endCol: 1
      }, "");
      setTimeout(function () { startBubbleEdit(a.id); }, 50);
    }
    addRow.addEventListener("click", onAddClick);
  }

  // ---- syntax highlighting ----
  function balanceSpans(html) {
    var lines = html.split("\n");
    var result = [];
    var openTags = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      // prepend any open spans from the previous line
      for (var j = 0; j < openTags.length; j++) {
        line = openTags[j] + line;
      }
      // find all span opens and closes in this line
      var opens = [];
      var closes = 0;
      var re = /<\/?span[^>]*>/g;
      var m;
      while ((m = re.exec(line)) !== null) {
        if (m[0].charAt(1) === "/") {
          closes++;
        } else {
          opens.push(m[0]);
        }
      }
      // compute still-open tags at end of this line
      // closes cancel out the most recent opens; leftover opens carry forward
      var carried = [];
      for (var k = 0; k < opens.length; k++) {
        carried.push(opens[k]);
      }
      for (var c = 0; c < closes; c++) {
        carried.pop();
      }
      // close any still-open spans at end of this line
      var suffix = "";
      for (var s = 0; s < carried.length; s++) {
        suffix += "</span>";
      }
      result.push(line + suffix);
      openTags = carried;
    }
    return result;
  }

  function highlightCodeBlocks() {
    if (typeof hljs === "undefined") return;

    var fences = contentEl.querySelectorAll(".line.code-fence");
    // walk fences in pairs: opening fence, then closing fence
    for (var f = 0; f < fences.length; f += 2) {
      var openFence = fences[f];
      var closeFence = fences[f + 1];
      if (!closeFence) break;

      // extract language hint from the opening fence text
      var fenceText = openFence.textContent || "";
      var langMatch = fenceText.match(/^```(\w+)/);
      var lang = langMatch ? langMatch[1] : null;

      // skip mermaid blocks - they have their own rendering
      if (lang && lang.toLowerCase() === "mermaid") continue;

      // collect code-block-line divs between the two fences
      var codeLines = [];
      var el = openFence.nextElementSibling;
      while (el && el !== closeFence) {
        if (el.classList.contains("code-block-line")) {
          codeLines.push(el);
        }
        el = el.nextElementSibling;
      }

      if (codeLines.length === 0) continue;

      // combine text content
      var combined = [];
      for (var i = 0; i < codeLines.length; i++) {
        combined.push(codeLines[i].textContent);
      }
      var code = combined.join("\n");

      // highlight
      var highlighted;
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(code, { language: lang });
        } else {
          highlighted = hljs.highlightAuto(code);
        }
      } catch (e) {
        continue; // skip on error, leave plain text
      }

      // split highlighted HTML back into per-line chunks
      var highlightedLines = balanceSpans(highlighted.value);

      // apply to each code-block-line div
      for (var k = 0; k < codeLines.length; k++) {
        if (k < highlightedLines.length) {
          codeLines[k].innerHTML = highlightedLines[k];
        }
      }
    }
  }

  // ---- selection detection ----
  function getLineFromNode(node) {
    var el = node.nodeType === 3 ? node.parentElement : node;
    while (el && !el.dataset.line) {
      el = el.parentElement;
    }
    return el ? parseInt(el.dataset.line, 10) : null;
  }

  function getColumnOffset(container, offset) {
    if (!container) return 1;

    // find nearest ancestor with raw coordinate data
    var el = container.nodeType === 3 ? container.parentElement : container;
    while (el && !el.dataset.rawStart) {
      el = el.parentElement;
    }

    if (el && el.dataset.rawStart) {
      var rawStart = parseInt(el.dataset.rawStart, 10);
      // count text chars before selection point within this element
      if (container.nodeType === 3 && container.parentNode === el) {
        return rawStart + offset;
      }
      // container is deeper - walk text nodes to count offset
      var textBefore = 0;
      var found = false;
      (function walk(node) {
        if (found) return;
        if (node.nodeType === 3) {
          if (node === container) {
            textBefore += offset;
            found = true;
          } else {
            textBefore += node.textContent.length;
          }
        } else {
          for (var j = 0; j < node.childNodes.length; j++) {
            walk(node.childNodes[j]);
            if (found) return;
          }
        }
      })(el);
      return rawStart + textBefore;
    }

    // fallback: DOM-based offset
    if (container.nodeType === 3) {
      return container.textContent.substring(0, offset).length + 1;
    }
    return 1;
  }

  function handleMouseUp() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      hideActionMenu();
      return;
    }

    var range = sel.getRangeAt(0);
    var startLine = getLineFromNode(range.startContainer);
    var endLine = getLineFromNode(range.endContainer);

    if (!startLine || !endLine) {
      hideActionMenu();
      return;
    }

    // make sure selection is within the content area
    if (!contentEl.contains(range.startContainer) || !contentEl.contains(range.endContainer)) {
      hideActionMenu();
      return;
    }

    var startCol = getColumnOffset(range.startContainer, range.startOffset);
    var endCol = getColumnOffset(range.endContainer, range.endOffset);

    // position the action menu near the end of the selection
    var rect = range.getBoundingClientRect();
    showActionMenu(rect, startLine, startCol, endLine, endCol);
  }

  function showActionMenu(rect, startLine, startCol, endLine, endCol) {
    actionMenu.style.display = "flex";
    actionMenu.style.left = Math.min(rect.right + 4, window.innerWidth - 100) + "px";
    actionMenu.style.top = rect.top - 4 + "px";

    actionMenu._selRange = {
      startLine: startLine,
      startCol: startCol,
      endLine: endLine,
      endCol: endCol
    };
  }

  function hideActionMenu() {
    actionMenu.style.display = "none";
    actionMenu._selRange = null;
  }

  // ---- annotation creation ----
  function addAnnotation(type, range, text, browserRange) {
    var a = {
      id: nextId++,
      type: type,
      startLine: range.startLine,
      startCol: range.startCol,
      endLine: range.endLine,
      endCol: range.endCol,
      text: text || ""
    };
    annotations.push(a);

    if (browserRange) {
      wrapSelectionRange(browserRange, a.id, type);
    }

    renderBubbles();
    updateAnnotationCount();
    window.getSelection().removeAllRanges();
    hideActionMenu();
    return a;
  }

  function removeAnnotation(id) {
    for (var i = 0; i < annotations.length; i++) {
      if (annotations[i].id === id) {
        unwrapAnnotation(id);
        annotations.splice(i, 1);
        break;
      }
    }
    renderBubbles();
    updateAnnotationCount();
  }

  // ---- character-level annotation wrapping ----
  function getTextNodesIn(node) {
    var textNodes = [];
    if (node.nodeType === 3) {
      textNodes.push(node);
    } else {
      for (var i = 0; i < node.childNodes.length; i++) {
        textNodes = textNodes.concat(getTextNodesIn(node.childNodes[i]));
      }
    }
    return textNodes;
  }

  function wrapSelectionRange(browserRange, annotId, type) {
    if (!browserRange) return;
    try {
      // Collect all text nodes within the range
      var ancestor = browserRange.commonAncestorContainer;
      if (ancestor.nodeType === 3) ancestor = ancestor.parentNode;

      var allTextNodes = getTextNodesIn(ancestor);
      var inRange = false;
      var nodesToWrap = [];

      for (var i = 0; i < allTextNodes.length; i++) {
        var tn = allTextNodes[i];
        if (tn === browserRange.startContainer || tn === browserRange.endContainer) {
          if (tn === browserRange.startContainer && tn === browserRange.endContainer) {
            // Selection within a single text node
            nodesToWrap.push({
              node: tn,
              startOffset: browserRange.startOffset,
              endOffset: browserRange.endOffset
            });
            break;
          } else if (tn === browserRange.startContainer) {
            inRange = true;
            nodesToWrap.push({
              node: tn,
              startOffset: browserRange.startOffset,
              endOffset: tn.textContent.length
            });
          } else {
            // endContainer
            nodesToWrap.push({
              node: tn,
              startOffset: 0,
              endOffset: browserRange.endOffset
            });
            break;
          }
        } else if (inRange) {
          // Stop if this text node is past the selection end.
          // Happens when endContainer is an element (e.g. empty line div)
          // and no text node will ever === endContainer.
          try {
            if (!browserRange.isPointInRange(tn, 0)) break;
          } catch (e) { break; }
          nodesToWrap.push({
            node: tn,
            startOffset: 0,
            endOffset: tn.textContent.length
          });
        }
      }

      // Wrap each portion in reverse order to preserve offsets
      for (var j = nodesToWrap.length - 1; j >= 0; j--) {
        var info = nodesToWrap[j];
        if (info.startOffset === info.endOffset) continue;

        var span = document.createElement("span");
        span.className = "annot-mark annot-" + type;
        span.setAttribute("data-annot-mark", annotId);

        var subRange = document.createRange();
        subRange.setStart(info.node, info.startOffset);
        subRange.setEnd(info.node, info.endOffset);
        subRange.surroundContents(span);
      }
    } catch (ex) {
      // Fallback: if surroundContents fails (e.g., cross-element boundary),
      // just skip -- the annotation still exists in the data model
    }
  }

  function unwrapAnnotation(annotId) {
    var marks = contentEl.querySelectorAll('[data-annot-mark="' + annotId + '"]');
    for (var i = 0; i < marks.length; i++) {
      var span = marks[i];
      var parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
      parent.normalize();
    }
  }

  // ---- bubble rendering ----
  function renderBubbles() {
    var html = "";
    // sort by startLine
    var sorted = annotations.slice().sort(function (a, b) { return a.startLine - b.startLine; });

    for (var i = 0; i < sorted.length; i++) {
      var a = sorted[i];
      var rangeStr = "L" + a.startLine + ":" + a.startCol + " - L" + a.endLine + ":" + a.endCol;
      var typeCls = a.type === "delete" ? "delete" : "comment";
      var typeLabelCls = a.type === "delete" ? "delete-type" : "comment-type";
      var typeLabel = a.type === "delete" ? "removed" : "comment";

      html += '<div class="annotation-bubble ' + typeCls + '" data-annot-id="' + a.id + '">';
      html += '<button class="bubble-close" data-remove="' + a.id + '" title="Remove">';
      html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      html += "</button>";
      html += '<div class="bubble-range">' + rangeStr + "</div>";
      html += '<div class="bubble-type ' + typeLabelCls + '">' + typeLabel + "</div>";

      if (a.type === "comment") {
        html += '<div class="bubble-text" data-edit="' + a.id + '">' + escHtml(a.text || "(click to edit)") + "</div>";
        html += '<textarea class="bubble-textarea" data-textarea="' + a.id + '">' + escHtml(a.text) + "</textarea>";
      }

      html += "</div>";
    }

    annotColEl.innerHTML = html;
  }

  function findAnnotation(id) {
    for (var i = 0; i < annotations.length; i++) {
      if (annotations[i].id === id) return annotations[i];
    }
    return null;
  }

  // ---- bubble interactions (delegated) ----
  annotColEl.addEventListener("click", function (e) {
    var target = e.target.closest("[data-remove]");
    if (target) {
      removeAnnotation(parseInt(target.dataset.remove, 10));
      return;
    }

    var editTarget = e.target.closest("[data-edit]");
    if (editTarget) {
      var id = parseInt(editTarget.dataset.edit, 10);
      startBubbleEdit(id);
      return;
    }
  });

  // ---- bubble-to-content hover highlight ----
  annotColEl.addEventListener("mouseenter", function (e) {
    var bubble = e.target.closest(".annotation-bubble");
    if (!bubble) return;
    var id = bubble.getAttribute("data-annot-id");
    if (!id) return;
    var marks = contentEl.querySelectorAll('[data-annot-mark="' + id + '"]');
    for (var i = 0; i < marks.length; i++) {
      marks[i].classList.add("annot-highlight");
    }
  }, true);

  annotColEl.addEventListener("mouseleave", function (e) {
    var bubble = e.target.closest(".annotation-bubble");
    if (!bubble) return;
    var id = bubble.getAttribute("data-annot-id");
    if (!id) return;
    var marks = contentEl.querySelectorAll('[data-annot-mark="' + id + '"]');
    for (var i = 0; i < marks.length; i++) {
      marks[i].classList.remove("annot-highlight");
    }
  }, true);

  function startBubbleEdit(id) {
    var textEl = annotColEl.querySelector('[data-edit="' + id + '"]');
    var taEl = annotColEl.querySelector('[data-textarea="' + id + '"]');
    if (!textEl || !taEl) return;

    textEl.classList.add("editing");
    taEl.classList.add("active");
    taEl.focus();

    function finishEdit() {
      var val = taEl.value.trim();
      var a = findAnnotation(id);
      if (!a) return;

      if (val === "") {
        removeAnnotation(id);
        return;
      }

      a.text = val;
      textEl.textContent = val;
      textEl.classList.remove("editing");
      taEl.classList.remove("active");
    }

    taEl.onblur = finishEdit;
    taEl.onkeydown = function (ev) {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        taEl.blur();
      }
    };
  }

  // ---- annotation count ----
  function updateAnnotationCount() {
    var count = annotations.length;
    if (count > 0) {
      annotCountEl.innerHTML = "<strong>" + count + "</strong> annotation" + (count > 1 ? "s" : "");
      btnChanges.disabled = false;
    } else {
      annotCountEl.textContent = "No annotations yet";
      btnChanges.disabled = true;
    }
  }

  // ---- build feedback string ----
  function buildFeedback() {
    var sorted = annotations.slice().sort(function (a, b) { return a.startLine - b.startLine; });
    var lines = ["User reviewed the plan and requested changes:\n"];

    for (var i = 0; i < sorted.length; i++) {
      var a = sorted[i];
      var range = "L" + a.startLine + ":" + a.startCol + "-L" + a.endLine + ":" + a.endCol;
      if (a.type === "delete") {
        lines.push("- " + range + " [delete]: Remove this section" + (a.text ? " -- " + a.text : ""));
      } else {
        lines.push("- " + range + " [comment]: " + a.text);
      }
    }

    return lines.join("\n");
  }

  // ---- submit ----
  var decisionMade = false;

  function sendDecision(payload) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://127.0.0.1:" + PORT + "/decision", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(payload));
  }

  function showOverlay(iconHtml, title, text) {
    document.getElementById("overlayIcon").innerHTML = iconHtml;
    document.getElementById("overlayTitle").textContent = title;
    document.getElementById("overlayText").textContent = text;
    document.getElementById("overlay").classList.add("show");
  }

  var approveIcon = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3fb950" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  var changesIcon = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d29922" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';

  function submitChanges() {
    decisionMade = true;
    var feedback = buildFeedback();
    sendDecision({ action: "deny", feedback: feedback });
    showOverlay(changesIcon, "Changes Requested", "Feedback sent to Claude Code. You can close this tab.");
  }

  // ---- action menu buttons ----
  btnComment.addEventListener("click", function (e) {
    e.stopPropagation();
    var range = actionMenu._selRange;
    if (!range) return;
    var sel = window.getSelection();
    var browserRange = (sel && sel.rangeCount) ? sel.getRangeAt(0).cloneRange() : null;
    var a = addAnnotation("comment", range, "", browserRange);
    // immediately open edit on the new bubble
    setTimeout(function () { startBubbleEdit(a.id); }, 50);
  });

  btnDelete.addEventListener("click", function (e) {
    e.stopPropagation();
    var range = actionMenu._selRange;
    if (!range) return;
    var sel = window.getSelection();
    var browserRange = (sel && sel.rangeCount) ? sel.getRangeAt(0).cloneRange() : null;
    addAnnotation("delete", range, "", browserRange);
  });

  // ---- global events ----
  contentEl.addEventListener("mouseup", function () {
    setTimeout(handleMouseUp, 10);
  });

  document.addEventListener("mousedown", function (e) {
    if (!actionMenu.contains(e.target)) {
      hideActionMenu();
    }
  });

  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (annotations.length > 0) {
        submitChanges();
      }
    }
    if (e.key === "Escape") {
      hideActionMenu();
    }
  });

  // ---- public API for inline handlers ----
  window.reviewApp = {
    submitChanges: submitChanges
  };

  // ---- init ----
  render();

  // ---- poll for console approval ----
  var pollFailures = 0;
  var pollTimer = setInterval(function () {
    if (decisionMade) {
      clearInterval(pollTimer);
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://127.0.0.1:" + PORT + "/status", true);
    xhr.timeout = 2000;
    xhr.onload = function () {
      if (decisionMade) return;
      if (xhr.status !== 200) {
        pollFailures++;
        if (pollFailures >= 2) {
          decisionMade = true;
          clearInterval(pollTimer);
          showOverlay(approveIcon, "Plan Approved from Console", "You can close this tab.");
        }
        return;
      }
      try {
        var resp = JSON.parse(xhr.responseText);
        pollFailures = 0;
        if (resp.status === "approved") {
          decisionMade = true;
          clearInterval(pollTimer);
          showOverlay(approveIcon, "Plan Approved from Console", "You can close this tab.");
        }
      } catch (e) {
        pollFailures++;
        if (pollFailures >= 2) {
          decisionMade = true;
          clearInterval(pollTimer);
          showOverlay(approveIcon, "Plan Approved from Console", "You can close this tab.");
        }
      }
    };
    xhr.onerror = function () {
      if (decisionMade) return;
      pollFailures++;
      if (pollFailures >= 3) {
        decisionMade = true;
        clearInterval(pollTimer);
        showOverlay(approveIcon, "Plan Approved from Console", "You can close this tab.");
      }
    };
    xhr.ontimeout = function () { /* ignore, retry next tick */ };
    xhr.send();
  }, 1000);
})();
