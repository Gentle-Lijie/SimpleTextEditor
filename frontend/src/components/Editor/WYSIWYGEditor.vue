<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { renderMarkdown } from '@/utils/markdown-it-config'
import DOMPurify from 'dompurify'
import TurndownService from 'turndown'
// @ts-expect-error - no type definitions
import { gfm, strikethrough, tables, taskListItems } from 'turndown-plugin-gfm'

const editorStore = useEditorStore()
const editorElement = ref<HTMLDivElement | null>(null)
const isComposing = ref(false)
const lastSavedSelection = ref<{ start: number; end: number } | null>(null)

// Configure Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined'
})

// Add GFM plugins
turndownService.use(gfm)

// Custom rules for better Markdown conversion
turndownService.addRule('taskList', {
  filter: (node) => {
    return node.nodeName === 'INPUT' &&
           node.getAttribute('type') === 'checkbox'
  },
  replacement: (_content, node) => {
    const checked = (node as HTMLInputElement).checked
    return checked ? '[x] ' : '[ ] '
  }
})

turndownService.addRule('highlight', {
  filter: 'mark',
  replacement: (content) => `==${content}==`
})

turndownService.addRule('subscript', {
  filter: 'sub',
  replacement: (content) => `~${content}~`
})

turndownService.addRule('superscript', {
  filter: 'sup',
  replacement: (content) => `^${content}^`
})

// Convert colored text back to HTML spans (preserve them)
turndownService.addRule('coloredText', {
  filter: (node) => {
    return node.nodeName === 'SPAN' &&
           (node.getAttribute('style')?.includes('color:') ||
            node.getAttribute('style')?.includes('background-color:'))
  },
  replacement: (_content, node) => {
    return (node as HTMLElement).outerHTML
  }
})

// Rendered HTML content
const renderedContent = computed(() => {
  const html = renderMarkdown(editorStore.content)
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['input'],
    ADD_ATTR: ['checked', 'type', 'disabled']
  })
})

// Flag to prevent update loops
let isUpdatingFromSource = false

// Watch for changes from source and update WYSIWYG
watch(() => editorStore.content, () => {
  if (!isUpdatingFromSource && editorElement.value) {
    saveSelection()
    nextTick(() => {
      if (editorElement.value) {
        editorElement.value.innerHTML = renderedContent.value
        initializeMermaid()
        restoreSelection()
      }
    })
  }
}, { immediate: true })

// Initialize mermaid diagrams
async function initializeMermaid() {
  const mermaidElements = editorElement.value?.querySelectorAll('.mermaid')
  if (mermaidElements && mermaidElements.length > 0) {
    const mermaid = await import('mermaid')
    mermaid.default.init(undefined, mermaidElements as NodeListOf<Element>)
  }
}

// Save current cursor position
function saveSelection() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !editorElement.value) return

  const range = selection.getRangeAt(0)
  if (!editorElement.value.contains(range.commonAncestorContainer)) return

  // Convert to text offset
  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(editorElement.value)
  preCaretRange.setEnd(range.startContainer, range.startOffset)
  const start = preCaretRange.toString().length

  preCaretRange.setEnd(range.endContainer, range.endOffset)
  const end = preCaretRange.toString().length

  lastSavedSelection.value = { start, end }
}

// Restore cursor position
function restoreSelection() {
  if (!lastSavedSelection.value || !editorElement.value) return

  const { start, end } = lastSavedSelection.value
  const range = document.createRange()
  const selection = window.getSelection()

  let charIndex = 0
  let startNode: Node | null = null
  let startOffset = 0
  let endNode: Node | null = null
  let endOffset = 0

  const walker = document.createTreeWalker(
    editorElement.value,
    NodeFilter.SHOW_TEXT,
    null
  )

  let node: Node | null
  while ((node = walker.nextNode())) {
    const textNode = node as Text
    const nextCharIndex = charIndex + textNode.length

    if (!startNode && start <= nextCharIndex) {
      startNode = textNode
      startOffset = start - charIndex
    }
    if (!endNode && end <= nextCharIndex) {
      endNode = textNode
      endOffset = end - charIndex
    }

    if (startNode && endNode) break
    charIndex = nextCharIndex
  }

  if (startNode && endNode) {
    range.setStart(startNode, startOffset)
    range.setEnd(endNode, endOffset)
    selection?.removeAllRanges()
    selection?.addRange(range)
  }
}

// Handle input in WYSIWYG editor
function handleInput() {
  if (isComposing.value || !editorElement.value) return

  isUpdatingFromSource = true

  // Convert HTML back to Markdown
  const html = editorElement.value.innerHTML
  const markdown = turndownService.turndown(html)

  editorStore.setContent(markdown)

  nextTick(() => {
    isUpdatingFromSource = false
  })
}

// Handle composition (for CJK input)
function handleCompositionStart() {
  isComposing.value = true
}

function handleCompositionEnd() {
  isComposing.value = false
  handleInput()
}

// Handle keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  const ctrl = event.ctrlKey || event.metaKey

  // Bold: Ctrl+B
  if (ctrl && event.key === 'b') {
    event.preventDefault()
    document.execCommand('bold', false)
    handleInput()
    return
  }

  // Italic: Ctrl+I
  if (ctrl && event.key === 'i') {
    event.preventDefault()
    document.execCommand('italic', false)
    handleInput()
    return
  }

  // Underline: Ctrl+U
  if (ctrl && event.key === 'u') {
    event.preventDefault()
    document.execCommand('underline', false)
    handleInput()
    return
  }

  // Handle tab for lists
  if (event.key === 'Tab') {
    event.preventDefault()
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const listItem = range.startContainer.parentElement?.closest('li')
      if (listItem) {
        // Indent/outdent list item
        if (event.shiftKey) {
          document.execCommand('outdent', false)
        } else {
          document.execCommand('indent', false)
        }
        handleInput()
      } else {
        // Insert tab character
        document.execCommand('insertText', false, '\t')
        handleInput()
      }
    }
  }

  // Handle Enter for new paragraphs
  if (event.key === 'Enter' && !event.shiftKey) {
    // Let default behavior handle it, then convert
    setTimeout(() => handleInput(), 0)
  }
}

// Handle paste - prefer plain text
function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
  handleInput()
}

// Handle checkbox clicks
function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
    // Toggle checkbox
    setTimeout(() => handleInput(), 0)
  }
}

// Expose sync method for external use (e.g., toolbar commands)
function syncToMarkdown() {
  handleInput()
}

defineExpose({
  syncToMarkdown
})

onMounted(() => {
  if (editorElement.value) {
    editorElement.value.innerHTML = renderedContent.value
    initializeMermaid()
  }
})
</script>

<template>
  <div class="wysiwyg-editor-container">
    <div
      ref="editorElement"
      class="wysiwyg-editor markdown-body"
      contenteditable="true"
      spellcheck="true"
      @input="handleInput"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      @keydown="handleKeydown"
      @paste="handlePaste"
      @click="handleClick"
    />
  </div>
</template>

<style scoped>
.wysiwyg-editor-container {
  height: 100%;
  overflow: hidden;
}

.wysiwyg-editor {
  height: 100%;
  padding: 24px 48px;
  overflow-y: auto;
  outline: none;
  background: var(--bg-primary);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-primary);
}

/* Make the editor feel more like a document */
.wysiwyg-editor:empty::before {
  content: '开始编写...';
  color: var(--text-tertiary);
}

/* Focus styling */
.wysiwyg-editor:focus {
  outline: none;
}

/* Editable elements styling */
.wysiwyg-editor :deep(h1),
.wysiwyg-editor :deep(h2),
.wysiwyg-editor :deep(h3),
.wysiwyg-editor :deep(h4),
.wysiwyg-editor :deep(h5),
.wysiwyg-editor :deep(h6) {
  cursor: text;
}

.wysiwyg-editor :deep(p) {
  margin: 0.5em 0;
}

.wysiwyg-editor :deep(ul),
.wysiwyg-editor :deep(ol) {
  padding-left: 2em;
}

.wysiwyg-editor :deep(li) {
  margin: 0.25em 0;
}

/* Task list styling */
.wysiwyg-editor :deep(input[type="checkbox"]) {
  margin-right: 0.5em;
  cursor: pointer;
}

/* Code blocks */
.wysiwyg-editor :deep(pre) {
  background: var(--bg-tertiary);
  padding: 1em;
  border-radius: var(--radius-md);
  overflow-x: auto;
}

.wysiwyg-editor :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.9em;
}

/* Inline code */
.wysiwyg-editor :deep(:not(pre) > code) {
  background: var(--bg-tertiary);
  padding: 0.2em 0.4em;
  border-radius: var(--radius-sm);
}

/* Blockquotes */
.wysiwyg-editor :deep(blockquote) {
  border-left: 4px solid var(--accent-primary);
  margin: 1em 0;
  padding-left: 1em;
  color: var(--text-secondary);
}

/* Tables */
.wysiwyg-editor :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.wysiwyg-editor :deep(th),
.wysiwyg-editor :deep(td) {
  border: 1px solid var(--border-color);
  padding: 0.5em 1em;
}

.wysiwyg-editor :deep(th) {
  background: var(--bg-secondary);
}

/* Links */
.wysiwyg-editor :deep(a) {
  color: var(--accent-primary);
  text-decoration: none;
}

.wysiwyg-editor :deep(a:hover) {
  text-decoration: underline;
}

/* Images */
.wysiwyg-editor :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

/* Horizontal rule */
.wysiwyg-editor :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 2em 0;
}

/* Mark/highlight */
.wysiwyg-editor :deep(mark) {
  background: #fff59d;
  padding: 0.1em 0.2em;
}
</style>
