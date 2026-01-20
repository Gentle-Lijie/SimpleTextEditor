import { renderMarkdown } from './markdown-it-config'

/**
 * Download content as a file
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export as Markdown file
 */
export function exportMarkdown(content: string, title: string = 'document') {
  const filename = `${title}.md`
  downloadFile(content, filename, 'text/markdown;charset=utf-8')
}

/**
 * Export as HTML file
 */
export function exportHTML(content: string, title: string = 'document') {
  const htmlContent = renderMarkdown(content)

  const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    code {
      background: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'SF Mono', Monaco, monospace;
    }
    pre {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ddd;
      margin: 0;
      padding-left: 1em;
      color: #666;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
    }
    th {
      background: #f5f5f5;
    }
    img {
      max-width: 100%;
    }
    a {
      color: #0366d6;
    }
    mark {
      background: #fff9c4;
      padding: 0.1em 0.2em;
    }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`

  const filename = `${title}.html`
  downloadFile(fullHTML, filename, 'text/html;charset=utf-8')
}

/**
 * Export as PDF (using browser print)
 */
export function exportPDF(content: string, title: string = 'document') {
  const htmlContent = renderMarkdown(content)

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('请允许弹出窗口以导出 PDF')
    return
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    @media print {
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #000;
        padding: 20px;
      }
      h1, h2, h3 { page-break-after: avoid; }
      pre, blockquote { page-break-inside: avoid; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.7;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    code { background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1em; color: #666; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; }
    th { background: #f5f5f5; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${htmlContent}
<script>
  window.onload = function() {
    setTimeout(function() {
      window.print();
      window.close();
    }, 500);
  };
</script>
</body>
</html>`)

  printWindow.document.close()
}

/**
 * Import markdown file
 */
export function importMarkdown(): Promise<{ content: string; filename: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,.txt'

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        resolve(null)
        return
      }

      try {
        const content = await file.text()
        const filename = file.name.replace(/\.(md|markdown|txt)$/, '')
        resolve({ content, filename })
      } catch (error) {
        console.error('Import error:', error)
        resolve(null)
      }
    }

    input.click()
  })
}
