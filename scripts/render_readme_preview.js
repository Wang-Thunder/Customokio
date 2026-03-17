const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const readmePath = path.join(root, "README.md");
const outputPath = path.join(root, "README.github-preview.html");

const markdown = fs.readFileSync(readmePath, "utf8").replace(/\r\n/g, "\n");

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function applyInline(text) {
  let output = escapeHtml(text);
  output = output.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return output;
}

function flushParagraph(lines, html) {
  if (!lines.length) return;
  html.push(`<p>${applyInline(lines.join(" "))}</p>`);
  lines.length = 0;
}

function flushCode(lines, html) {
  if (!lines.length) return;
  html.push(`<pre><code>${escapeHtml(lines.join("\n"))}</code></pre>`);
  lines.length = 0;
}

function closeLists(stack, html) {
  while (stack.length) {
    html.push(`</${stack.pop()}>`);
  }
}

const lines = markdown.split("\n");
const html = [];
const paragraph = [];
const code = [];
let inCode = false;
const listStack = [];

for (const line of lines) {
  if (line.startsWith("```")) {
    flushParagraph(paragraph, html);
    if (inCode) {
      flushCode(code, html);
      inCode = false;
    } else {
      closeLists(listStack, html);
      inCode = true;
    }
    continue;
  }

  if (inCode) {
    code.push(line);
    continue;
  }

  if (!line.trim()) {
    flushParagraph(paragraph, html);
    closeLists(listStack, html);
    continue;
  }

  const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
  if (headingMatch) {
    flushParagraph(paragraph, html);
    closeLists(listStack, html);
    const level = headingMatch[1].length;
    html.push(`<h${level}>${applyInline(headingMatch[2])}</h${level}>`);
    continue;
  }

  const unorderedMatch = line.match(/^(\s*)-\s+(.*)$/);
  const orderedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
  if (unorderedMatch || orderedMatch) {
    flushParagraph(paragraph, html);
    const indent = Math.floor(((unorderedMatch || orderedMatch)[1] || "").length / 2);
    const type = unorderedMatch ? "ul" : "ol";
    while (listStack.length > indent + 1) {
      html.push(`</${listStack.pop()}>`);
    }
    while (listStack.length < indent + 1) {
      listStack.push(type);
      html.push(`<${type}>`);
    }
    if (listStack[listStack.length - 1] !== type) {
      html.push(`</${listStack.pop()}>`);
      listStack.push(type);
      html.push(`<${type}>`);
    }
    html.push(`<li>${applyInline((unorderedMatch || orderedMatch)[2])}</li>`);
    continue;
  }

  closeLists(listStack, html);
  paragraph.push(line.trim());
}

flushParagraph(paragraph, html);
closeLists(listStack, html);
flushCode(code, html);

const documentHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Customokio README Preview</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f6f8fa;
      --surface: #ffffff;
      --text: #1f2328;
      --muted: #59636e;
      --border: #d0d7de;
      --code-bg: #f6f8fa;
      --link: #0969da;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0d1117;
        --surface: #161b22;
        --text: #e6edf3;
        --muted: #8b949e;
        --border: #30363d;
        --code-bg: #0d1117;
        --link: #58a6ff;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }
    .page {
      max-width: 980px;
      margin: 32px auto;
      padding: 0 16px;
    }
    .markdown-body {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    h1, h2, h3, h4, h5, h6 {
      margin: 24px 0 16px;
      line-height: 1.25;
    }
    h1, h2 {
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.3em;
    }
    p, ul, ol, pre {
      margin: 0 0 16px;
    }
    ul, ol {
      padding-left: 2em;
    }
    li + li {
      margin-top: 0.25em;
    }
    a {
      color: var(--link);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    code {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.15em 0.4em;
      font: 85%/1.45 ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Consolas, monospace;
    }
    pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: auto;
      padding: 16px;
    }
    pre code {
      background: transparent;
      border: 0;
      padding: 0;
      font-size: 13px;
    }
    img {
      display: block;
      max-width: 100%;
      height: auto;
      margin: 20px auto;
      border: 1px solid var(--border);
      border-radius: 10px;
    }
    .meta {
      color: var(--muted);
      font-size: 14px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="meta">Local GitHub-style preview generated from README.md</div>
    <article class="markdown-body">
      ${html.join("\n")}
    </article>
  </div>
</body>
</html>`;

fs.writeFileSync(outputPath, documentHtml);
console.log(`Wrote ${path.basename(outputPath)}`);
