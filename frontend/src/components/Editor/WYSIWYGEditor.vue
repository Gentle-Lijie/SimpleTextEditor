<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick, inject } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { renderMarkdown } from '@/utils/markdown-it-config'
import DOMPurify from 'dompurify'
import TurndownService from 'turndown'
// @ts-expect-error - no type definitions
import { gfm } from 'turndown-plugin-gfm'
import { uploadImageFromClipboard, hasImageInClipboard, generateImageMarkdown } from '@/utils/imageUpload'

const editorStore = useEditorStore()
const editorElement = ref<HTMLDivElement | null>(null)
const isComposing = ref(false)
const lastSavedSelection = ref<{ start: number; end: number } | null>(null)
const isUploading = ref(false)

// Get collaboration from parent
const collaboration = inject<any>('collaboration')

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

// Convert colored text to HTML with data attributes for markdown conversion
turndownService.addRule('coloredText', {
  filter: (node) => {
    if (node.nodeName !== 'SPAN') return false
    const style = node.getAttribute('style') || ''
    return style.includes('color:') || style.includes('background-color:')
  },
  replacement: (content, node) => {
    const el = node as HTMLElement
    const style = el.getAttribute('style') || ''
    // Preserve HTML for colored text
    return `<span style="${style}">${content}</span>`
  }
})

// Preserve font color
turndownService.addRule('fontColor', {
  filter: 'font',
  replacement: (content, node) => {
    const el = node as HTMLElement
    const color = el.getAttribute('color')
    if (color) {
      return `<span style="color: ${color}">${content}</span>`
    }
    return content
  }
})

// Rendered HTML content
const renderedContent = computed(() => {
  const html = renderMarkdown(editorStore.content)
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['input'],
    ADD_ATTR: ['checked', 'type', 'disabled', 'style']
  })
})

// Flag to prevent update loops
let isUpdatingFromSource = false
let isLocalInput = false

// Watch for changes from source and update WYSIWYG
watch(() => editorStore.content, () => {
  if (!isUpdatingFromSource && !isLocalInput && editorElement.value) {
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

// Markdown patterns for instant rendering
const markdownPatterns = [
  // Bold: **text** or __text__
  { pattern: /\*\*([^*]+)\*\*$/, replacement: '<strong>$1</strong>' },
  { pattern: /__([^_]+)__$/, replacement: '<strong>$1</strong>' },
  // Italic: *text* or _text_
  { pattern: /(?<!\*)\*([^*]+)\*(?!\*)$/, replacement: '<em>$1</em>' },
  { pattern: /(?<!_)_([^_]+)_(?!_)$/, replacement: '<em>$1</em>' },
  // Strikethrough: ~~text~~
  { pattern: /~~([^~]+)~~$/, replacement: '<del>$1</del>' },
  // Highlight: ==text==
  { pattern: /==([^=]+)==$/, replacement: '<mark>$1</mark>' },
  // Inline code: `code`
  { pattern: /`([^`]+)`$/, replacement: '<code>$1</code>' },
  // Subscript: ~text~
  { pattern: /(?<!~)~([^~]+)~(?!~)$/, replacement: '<sub>$1</sub>' },
  // Superscript: ^text^
  { pattern: /\^([^^]+)\^$/, replacement: '<sup>$1</sup>' },
]

// Check if current text node ends with a markdown pattern and render it
function checkAndRenderMarkdown() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false

  const range = selection.getRangeAt(0)
  const textNode = range.startContainer

  if (textNode.nodeType !== Node.TEXT_NODE) return false

  const text = textNode.textContent || ''
  const cursorPos = range.startOffset
  const textBeforeCursor = text.substring(0, cursorPos)

  for (const { pattern, replacement } of markdownPatterns) {
    const match = textBeforeCursor.match(pattern)
    if (match) {
      // Found a pattern, replace it
      const fullMatch = match[0]
      const startIdx = cursorPos - fullMatch.length

      // Create the new HTML element
      const temp = document.createElement('div')
      temp.innerHTML = fullMatch.replace(pattern, replacement)
      const newElement = temp.firstChild

      if (newElement) {
        // Split the text node and insert the new element
        const beforeText = text.substring(0, startIdx)
        const afterText = text.substring(cursorPos)

        const parent = textNode.parentNode
        if (!parent) return false

        // Create text nodes for before and after
        const beforeNode = document.createTextNode(beforeText)
        const afterNode = document.createTextNode(afterText)

        // Replace
        parent.insertBefore(beforeNode, textNode)
        parent.insertBefore(newElement, textNode)
        parent.insertBefore(afterNode, textNode)
        parent.removeChild(textNode)

        // Move cursor after the new element
        const newRange = document.createRange()
        newRange.setStartAfter(newElement)
        newRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(newRange)

        return true
      }
    }
  }

  return false
}

// Handle input in WYSIWYG editor
function handleInput() {
  if (isComposing.value || !editorElement.value) return

  isLocalInput = true
  isUpdatingFromSource = true

  // Try to render markdown patterns
  const rendered = checkAndRenderMarkdown()

  // Convert HTML back to Markdown
  const html = editorElement.value.innerHTML
  const markdown = turndownService.turndown(html)

  editorStore.setContent(markdown)

  nextTick(() => {
    isUpdatingFromSource = false
    isLocalInput = false
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

// Clear formatting for new line
function clearFormattingForNewLine() {
  // Remove any inline styles from the current selection
  document.execCommand('removeFormat', false)
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

  // Handle Enter for new paragraphs - clear formatting
  if (event.key === 'Enter' && !event.shiftKey) {
    // Let browser handle the enter, then clear formatting on new line
    setTimeout(() => {
      clearFormattingForNewLine()
      handleInput()
    }, 0)
  }
}

// Handle paste - check for images first, then plain text
async function handlePaste(event: ClipboardEvent) {
  if (!event.clipboardData) return

  // Check if clipboard has image
  if (hasImageInClipboard(event.clipboardData)) {
    event.preventDefault()
    isUploading.value = true

    try {
      const result = await uploadImageFromClipboard(event.clipboardData)
      if (result && result.success && result.url) {
        // Insert image
        const img = document.createElement('img')
        img.src = result.url
        img.alt = 'image'

        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          range.insertNode(img)
          range.setStartAfter(img)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        }

        handleInput()
      } else {
        console.error('Image upload failed:', result?.error)
        alert('图片上传失败: ' + (result?.error || '未知错误'))
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alert('图片上传出错')
    } finally {
      isUploading.value = false
    }
    return
  }

  // Plain text paste
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

// Handle selection change for collaboration
function handleSelectionChange() {
  if (!collaboration) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !editorElement.value) return

  const range = selection.getRangeAt(0)
  if (!editorElement.value.contains(range.commonAncestorContainer)) return

  // Get cursor position
  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(editorElement.value)
  preCaretRange.setEnd(range.startContainer, range.startOffset)
  const start = preCaretRange.toString().length

  preCaretRange.setEnd(range.endContainer, range.endOffset)
  const end = preCaretRange.toString().length

  // Calculate line and column
  const textBeforeCursor = editorElement.value.innerText.substring(0, start)
  const lines = textBeforeCursor.split('\n')
  const line = lines.length
  const column = lines[lines.length - 1].length + 1

  collaboration.updateCursor(line, column, start)
  if (start !== end) {
    collaboration.updateSelection(start, end)
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

  // Listen for selection changes
  document.addEventListener('selectionchange', handleSelectionChange)
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

    <!-- Upload indicator -->
    <div v-if="isUploading" class="upload-indicator">
      <span class="upload-spinner"></span>
      <span>上传图片中...</span>
    </div>
  </div>
</template>

<style scoped>
.wysiwyg-editor-container {
  height: 100%;
  overflow: hidden;
  position: relative;
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

/* Strong and em */
.wysiwyg-editor :deep(strong) {
  font-weight: 700;
}

.wysiwyg-editor :deep(em) {
  font-style: italic;
}

/* Strikethrough */
.wysiwyg-editor :deep(del) {
  text-decoration: line-through;
}

/* Subscript and superscript */
.wysiwyg-editor :deep(sub) {
  vertical-align: sub;
  font-size: smaller;
}

.wysiwyg-editor :deep(sup) {
  vertical-align: super;
  font-size: smaller;
}

/* Upload indicator */
.upload-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 20;
}

.upload-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
