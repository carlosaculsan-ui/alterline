function htmlTemplate(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 15px;
      line-height: 1.75;
      color: #111;
      background: #fff;
      padding: 60px 24px;
    }
    .wrapper { max-width: 700px; margin: 0 auto; }
    h1 { font-size: 2em; font-weight: 700; margin-bottom: 0.25em; }
    .entry-title { font-size: 2rem; font-weight: 700; margin-bottom: 1.5rem; border-bottom: 1px solid #e5e5e5; padding-bottom: 1rem; }
    h1 { font-size: 1.75em; font-weight: 700; margin: 1.5em 0 0.5em; }
    h2 { font-size: 1.4em; font-weight: 600; margin: 1.25em 0 0.5em; }
    h3 { font-size: 1.15em; font-weight: 600; margin: 1em 0 0.4em; }
    p { margin-bottom: 1em; }
    ul, ol { padding-left: 1.5em; margin-bottom: 1em; }
    li { margin-bottom: 0.25em; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    u { text-decoration: underline; }
    a { color: #6366f1; text-decoration: underline; }
    @media print {
      body { padding: 0; }
      .entry-title { border-bottom: 1px solid #ccc; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="entry-title">${title}</div>
    ${bodyHtml}
  </div>
</body>
</html>`;
}

function triggerDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function nodeToMarkdown(node, listType = null, listIndex = { n: 1 }) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const tag = node.tagName.toLowerCase();
  const children = Array.from(node.childNodes);
  const inner = () => children.map(c => nodeToMarkdown(c, listType, listIndex)).join('');

  switch (tag) {
    case 'h1': return `\n# ${inner().trim()}\n`;
    case 'h2': return `\n## ${inner().trim()}\n`;
    case 'h3': return `\n### ${inner().trim()}\n`;
    case 'p': {
      const text = inner().trim();
      return text ? `\n${text}\n` : '\n';
    }
    case 'strong':
    case 'b': return `**${inner()}**`;
    case 'em':
    case 'i': return `*${inner()}*`;
    case 'u': return `__${inner()}__`;
    case 'br': return '\n';
    case 'ul': {
      const items = children
        .filter(c => c.nodeType === Node.ELEMENT_NODE && c.tagName.toLowerCase() === 'li')
        .map(li => `- ${Array.from(li.childNodes).map(c => nodeToMarkdown(c)).join('').trim()}`)
        .join('\n');
      return `\n${items}\n`;
    }
    case 'ol': {
      let i = 1;
      const items = children
        .filter(c => c.nodeType === Node.ELEMENT_NODE && c.tagName.toLowerCase() === 'li')
        .map(li => `${i++}. ${Array.from(li.childNodes).map(c => nodeToMarkdown(c)).join('').trim()}`)
        .join('\n');
      return `\n${items}\n`;
    }
    case 'li': return inner();
    case 'a': {
      // Entry links: render as plain text (internal only)
      if (node.classList.contains('entry-link')) return inner();
      const href = node.getAttribute('href');
      return href ? `[${inner()}](${href})` : inner();
    }
    case 'mark': return inner();
    case 'span': return inner();
    case 'div': return `\n${inner()}\n`;
    default: return inner();
  }
}

export function exportAsMarkdown(title, html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  let md = `# ${title}\n`;
  md += Array.from(body.childNodes).map(n => nodeToMarkdown(n)).join('');
  // Collapse 3+ consecutive newlines to 2
  md = md.replace(/\n{3,}/g, '\n\n').trim();

  const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  triggerDownload(`${safeTitle}.md`, md, 'text/markdown;charset=utf-8');
}

export function exportAsHTML(title, html) {
  const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  triggerDownload(`${safeTitle}.html`, htmlTemplate(title, html), 'text/html;charset=utf-8');
}

export function exportAsPDF(title, html) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(htmlTemplate(title, html));
  win.document.close();
  win.focus();
  // Give the browser a moment to render before printing
  setTimeout(() => {
    win.print();
  }, 400);
}
