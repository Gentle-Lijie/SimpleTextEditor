<script setup lang="ts">
import { computed, watch, nextTick, onMounted, ref, inject } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { renderMarkdown } from '@/utils/markdown-it-config'
import DOMPurify from 'dompurify'
import mermaid from 'mermaid'
import type { CollaborationUser } from '@/types'
import { getCaretRectFromIndex } from '@/utils/collaborationCursor'

const editorStore = useEditorStore()
const previewRef = ref<HTMLDivElement | null>(null)
const previewContentRef = ref<HTMLDivElement | null>(null)
const scrollTop = ref(0)
const scrollLeft = ref(0)

const collaboration = inject<any>('collaboration')

const collaboratorCursors = computed(() => {
  if (!collaboration) return []
  return collaboration.users.value.filter((u: CollaborationUser) => u.cursor)
})

const lockedLines = computed(() => {
  if (!collaboration || !collaboration.getLockedLines) return []
  return collaboration.getLockedLines()
})

// Initialize Mermaid
onMounted(() => {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true
    }
  })
})

// Render markdown and sanitize HTML
const renderedContent = computed(() => {
  const html = renderMarkdown(editorStore.content)
  // Sanitize HTML to prevent XSS
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'strong', 'em', 'del', 's', 'u', 'b', 'i',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'span', 'div', 'mark', 'sub', 'sup',
      'input', 'label', // for checkboxes
      'section', 'sup', 'a', // for footnotes
      'svg', 'path', 'g', 'rect', 'circle', 'line', 'polygon', 'polyline', 'text', 'tspan', 'defs', 'marker', 'foreignObject' // for mermaid
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'target', 'rel',
      'class', 'id', 'style',
      'type', 'checked', 'disabled', 'for', // for checkboxes
      // SVG attributes for mermaid
      'viewBox', 'xmlns', 'd', 'fill', 'stroke', 'stroke-width', 'transform',
      'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r',
      'x1', 'y1', 'x2', 'y2', 'points', 'marker-end', 'marker-start',
      'font-size', 'text-anchor', 'dominant-baseline', 'dy', 'dx',
      'aria-roledescription', 'role', 'aria-labelledby'
    ],
    ADD_TAGS: ['math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mroot', 'msqrt', 'mtext', 'annotation']
  })
})

// Render Mermaid diagrams after content updates
watch(renderedContent, async () => {
  await nextTick()
  try {
    const mermaidElements = document.querySelectorAll('.mermaid:not([data-processed])')
    if (mermaidElements.length > 0) {
      await mermaid.run({
        nodes: Array.from(mermaidElements) as HTMLElement[]
      })
    }
  } catch (e) {
    console.warn('Mermaid rendering error:', e)
  }
}, { flush: 'post' })

function handleScroll() {
  if (!previewRef.value) return
  scrollTop.value = previewRef.value.scrollTop
  scrollLeft.value = previewRef.value.scrollLeft
}

function getCursorStyle(user: CollaborationUser) {
  if (!user.cursor || !previewContentRef.value || !previewRef.value) return {}
  const index = user.cursor.index ?? 0
  const rect = getCaretRectFromIndex(previewContentRef.value, index)
  if (!rect) return {}

  const containerRect = previewRef.value.getBoundingClientRect()
  const _ = scrollTop.value + scrollLeft.value
  void _

  const top = rect.top - containerRect.top
  const left = rect.left - containerRect.left

  return {
    top: `${top}px`,
    left: `${left}px`,
    backgroundColor: user.color,
    '--user-color': user.color
  }
}

function getLockedLineMarkerStyle(lock: { line: number; user: CollaborationUser }) {
  if (!previewContentRef.value || !previewRef.value) return {}
  const index = lock.user.activity?.index ?? lock.user.cursor?.index ?? 0
  const rect = getCaretRectFromIndex(previewContentRef.value, index)
  if (!rect) return {}

  const containerRect = previewRef.value.getBoundingClientRect()
  const top = rect.top - containerRect.top
  const left = rect.right - containerRect.left + 6

  return {
    top: `${top}px`,
    left: `${left}px`,
    borderColor: lock.user.color,
    color: lock.user.color
  }
}
</script>

<template>
  <div class="preview" ref="previewRef" @scroll="handleScroll">
    <div id="write" class="preview-content markdown-body" ref="previewContentRef" v-html="renderedContent"></div>
    <div class="collaborator-layer">
      <div
        v-for="user in collaboratorCursors"
        :key="user.id"
        class="collaborator-cursor"
        :style="getCursorStyle(user)"
      >
        <div class="cursor-line" :style="{ backgroundColor: user.color }"></div>
        <div class="cursor-label" :style="{ backgroundColor: user.color }">
          {{ user.name }}
        </div>
      </div>
      <div
        v-for="lock in lockedLines"
        :key="`lock-${lock.line}-${lock.ownerId}`"
        class="locked-line-marker"
        :style="getLockedLineMarkerStyle(lock)"
      >
        {{ lock.user.name }} 正在编辑
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview {
  height: 100%;
  overflow-y: auto;
  background: var(--editor-bg);
  position: relative;
}

.preview-content {
  padding: 24px 32px;
  max-width: 900px;
  margin: 0 auto;
}

.collaborator-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
}

.collaborator-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 5;
}

.locked-line-marker {
  position: absolute;
  padding: 2px 6px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid;
  border-radius: 10px;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.cursor-line {
  width: 2px;
  height: 22px;
  animation: cursor-blink 1s ease-in-out infinite;
}

.cursor-label {
  position: absolute;
  top: -18px;
  left: 0;
  padding: 2px 6px;
  font-size: 11px;
  color: white;
  border-radius: 3px;
  white-space: nowrap;
  font-family: var(--font-sans);
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>

<style>
/* Markdown content styles */
.markdown-body {
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.7;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 {
  font-size: 2em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--border-color);
}

.markdown-body h2 {
  font-size: 1.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--border-color);
}

.markdown-body h3 {
  font-size: 1.25em;
}

.markdown-body h4 {
  font-size: 1em;
}

.markdown-body h5 {
  font-size: 0.875em;
}

.markdown-body h6 {
  font-size: 0.85em;
  color: var(--text-secondary);
}

.markdown-body p {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body a {
  color: var(--text-link);
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body ul,
.markdown-body ol {
  margin-top: 0;
  margin-bottom: 16px;
  padding-left: 2em;
}

.markdown-body li {
  margin-bottom: 4px;
}

.markdown-body li + li {
  margin-top: 4px;
}

.markdown-body blockquote {
  margin: 0 0 16px 0;
  padding: 0 1em;
  color: var(--text-secondary);
  border-left: 4px solid var(--border-color);
}

.markdown-body pre {
  margin-top: 0;
  margin-bottom: 16px;
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.markdown-body code {
  font-family: var(--font-mono);
  font-size: 85%;
}

.markdown-body pre code {
  display: block;
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: transparent;
  border: 0;
}

.markdown-body :not(pre) > code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.markdown-body table {
  width: 100%;
  margin-bottom: 16px;
  border-collapse: collapse;
  border-spacing: 0;
}

.markdown-body table th,
.markdown-body table td {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
}

.markdown-body table th {
  font-weight: 600;
  background-color: var(--bg-secondary);
}

.markdown-body table tr:nth-child(2n) {
  background-color: var(--bg-secondary);
}

.markdown-body hr {
  height: 2px;
  margin: 24px 0;
  background-color: var(--border-color);
  border: 0;
}

.markdown-body img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
}

.markdown-body mark {
  background-color: var(--accent-warning);
  padding: 0.1em 0.2em;
  border-radius: 2px;
}

/* Task list */
.markdown-body .task-list-item {
  list-style-type: none;
  margin-left: -1.5em;
}

.markdown-body .task-list-item input[type="checkbox"] {
  margin-right: 8px;
  vertical-align: middle;
}

/* Footnotes */
.markdown-body .footnotes {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  font-size: 0.9em;
}

.markdown-body .footnotes ol {
  padding-left: 1.5em;
}

.markdown-body .footnote-ref {
  font-size: 0.75em;
  vertical-align: super;
}

.markdown-body .footnote-backref {
  font-size: 0.75em;
  margin-left: 4px;
}

/* Subscript and Superscript */
.markdown-body sub {
  font-size: 0.75em;
  vertical-align: sub;
}

.markdown-body sup {
  font-size: 0.75em;
  vertical-align: super;
}

/* Mermaid diagrams */
.markdown-body .mermaid {
  margin: 16px 0;
  text-align: center;
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: var(--radius-md);
}

.markdown-body .mermaid svg {
  max-width: 100%;
  height: auto;
}

/* highlight.js styles */
.hljs {
  background: var(--bg-secondary) !important;
}

/* KaTeX styles */
.markdown-body .katex-display {
  margin: 1em 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.markdown-body .katex {
  font-size: 1.1em;
}

/* Responsive Styles */
@media screen and (max-width: 768px) {
  .preview-content {
    padding: 16px;
    max-width: none;
  }

  .markdown-body {
    font-size: 15px;
    line-height: 1.6;
  }

  .markdown-body h1 {
    font-size: 1.6em;
  }

  .markdown-body h2 {
    font-size: 1.35em;
  }

  .markdown-body h3 {
    font-size: 1.15em;
  }

  .markdown-body h1,
  .markdown-body h2,
  .markdown-body h3,
  .markdown-body h4,
  .markdown-body h5,
  .markdown-body h6 {
    margin-top: 20px;
    margin-bottom: 12px;
  }

  .markdown-body p {
    margin-bottom: 12px;
  }

  .markdown-body pre {
    padding: 12px;
    font-size: 13px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .markdown-body table {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .markdown-body table th,
  .markdown-body table td {
    padding: 8px 12px;
    white-space: nowrap;
  }

  .markdown-body blockquote {
    padding-left: 12px;
    margin-left: 0;
    margin-right: 0;
  }

  .markdown-body .mermaid {
    padding: 12px;
    overflow-x: auto;
  }

  .markdown-body .katex-display {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}

@media screen and (max-width: 480px) {
  .preview-content {
    padding: 12px;
  }

  .markdown-body {
    font-size: 14px;
  }

  .markdown-body h1 {
    font-size: 1.4em;
  }

  .markdown-body h2 {
    font-size: 1.2em;
  }

  .markdown-body h3 {
    font-size: 1.1em;
  }

  .markdown-body pre {
    font-size: 12px;
  }
}
</style>
