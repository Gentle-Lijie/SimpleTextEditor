import MarkdownIt from 'markdown-it'
import highlightjs from 'highlight.js'
// @ts-expect-error - no type definitions available
import taskLists from 'markdown-it-task-lists'
// @ts-expect-error - no type definitions available
import footnote from 'markdown-it-footnote'
// @ts-expect-error - no type definitions available
import { full as emoji } from 'markdown-it-emoji'
// @ts-expect-error - no type definitions available
import sub from 'markdown-it-sub'
// @ts-expect-error - no type definitions available
import sup from 'markdown-it-sup'
// @ts-expect-error - no type definitions available
import mark from 'markdown-it-mark'
// @ts-expect-error - no type definitions available
import abbr from 'markdown-it-abbr'
import katex from '@traptitech/markdown-it-katex'

// Create markdown-it instance with basic configuration
const md = new MarkdownIt({
  html: true,           // Allow HTML tags
  linkify: true,        // Auto-convert URLs to links
  typographer: true,    // Enable smart quotes and other typographic replacements
  breaks: true,         // Convert \n to <br>
  highlight: (str: string, lang: string): string => {
    // Handle Mermaid code blocks specially
    if (lang === 'mermaid') {
      return `<div class="mermaid">${str}</div>`
    }

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

// GFM Extensions
md.use(taskLists, { enabled: true, label: true, labelAfter: true })
md.use(footnote)
md.use(emoji)

// Extended syntax
md.use(sub)  // Subscript: H~2~O
md.use(sup)  // Superscript: X^2^
md.use(mark) // Highlight: ==marked==
md.use(abbr) // Abbreviations

// Math formulas (KaTeX)
md.use(katex, {
  throwOnError: false,
  errorColor: '#cc0000',
  strict: false
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
