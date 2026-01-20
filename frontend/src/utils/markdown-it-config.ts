import MarkdownIt from 'markdown-it'
import highlightjs from 'highlight.js'

// Create markdown-it instance with basic configuration
const md = new MarkdownIt({
  html: true,           // Allow HTML tags
  linkify: true,        // Auto-convert URLs to links
  typographer: true,    // Enable smart quotes and other typographic replacements
  breaks: true,         // Convert \n to <br>
  highlight: (str: string, lang: string): string => {
    if (lang && highlightjs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${highlightjs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch (_) {
        // Ignore errors
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

/**
 * Render markdown content to HTML
 */
export function renderMarkdown(content: string): string {
  return md.render(content)
}

/**
 * Get the markdown-it instance for advanced usage
 */
export function getMarkdownIt(): MarkdownIt {
  return md
}

export default md
