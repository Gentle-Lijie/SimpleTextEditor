<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed, nextTick, inject } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { renderMarkdown } from '@/utils/markdown-it-config'
import DOMPurify from 'dompurify'
import TurndownService from 'turndown'
// @ts-expect-error - no type definitions
import { gfm } from 'turndown-plugin-gfm'
import { uploadImageFromClipboard, hasImageInClipboard } from '@/utils/imageUpload'
import type { CollaborationUser } from '@/types'
import { getCaretRectFromIndex } from '@/utils/collaborationCursor'

const editorStore = useEditorStore()
const editorElement = ref<HTMLDivElement | null>(null)
const isComposing = ref(false)
const lastSavedSelection = ref<{ start: number; end: number } | null>(null)
const isUploading = ref(false)
const lockWarning = ref(false)
const scrollTop = ref(0)
const scrollLeft = ref(0)

// Selection toolbar removed - floating toolbar disabled

// Image resize state
const selectedImage = ref<HTMLImageElement | null>(null)
const imageResizeHandles = ref<{ x: number; y: number; width: number; height: number } | null>(null)
const isResizing = ref(false)
const resizeStartData = ref<{ startX: number; startY: number; startWidth: number; startHeight: number; handle: string } | null>(null)

// Get collaboration from parent
const collaboration = inject<any>('collaboration')

const collaboratorCursors = computed(() => {
  if (!collaboration) return []
  return collaboration.users.value.filter((u: CollaborationUser) => u.cursor)
})

const lockedLines = computed(() => {
  if (!collaboration || !collaboration.getLockedLines) return []
  return collaboration.getLockedLines()
})

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
  filter: (node: HTMLElement) => {
    return node.nodeName === 'INPUT' &&
           node.getAttribute('type') === 'checkbox'
  },
  replacement: (_content: string, node: HTMLElement) => {
    const checked = (node as HTMLInputElement).checked
    return checked ? '[x] ' : '[ ] '
  }
})

turndownService.addRule('highlight', {
  filter: 'mark',
  replacement: (content: string) => `==${content}==`
})

turndownService.addRule('subscript', {
  filter: 'sub',
  replacement: (content: string) => `~${content}~`
})

turndownService.addRule('superscript', {
  filter: 'sup',
  replacement: (content: string) => `^${content}^`
})

turndownService.addRule('lineBreak', {
  filter: 'br',
  replacement: () => '<br>\n'
})

turndownService.addRule('emptyBlock', {
  filter: (node: HTMLElement) => {
    if (node.nodeName !== 'DIV' && node.nodeName !== 'P') return false
    const text = (node.textContent || '').replace(/\u00a0/g, ' ')
    const hasMedia = !!node.querySelector('img,table,pre,blockquote,ul,ol,li,code')
    const hasOnlyBreak = node.children.length === 1 && node.children[0].tagName === 'BR'
    return !hasMedia && (!text.trim() || hasOnlyBreak)
  },
  replacement: () => '<br>\n'
})

// Convert colored text to HTML with data attributes for markdown conversion
turndownService.addRule('coloredText', {
  filter: (node: HTMLElement) => {
    if (node.nodeName !== 'SPAN') return false
    const style = node.getAttribute('style') || ''
    return style.includes('color:') || style.includes('background-color:')
  },
  replacement: (content: string, node: HTMLElement) => {
    const el = node as HTMLElement
    const style = el.getAttribute('style') || ''
    return `<span style="${style}">${content}</span>`
  }
})

// Preserve font color
turndownService.addRule('fontColor', {
  filter: (node: HTMLElement): boolean => {
    return node.nodeName === 'FONT'
  },
  replacement: (content: string, node: HTMLElement) => {
    const el = node as HTMLElement
    const color = el.getAttribute('color')
    if (color) {
      return `<span style="color: ${color}">${content}</span>`
    }
    return content
  }
})

// Handle images with width/height attributes
turndownService.addRule('imageWithSize', {
  filter: (node: HTMLElement): boolean => {
    return node.nodeName === 'IMG' && !!(node.getAttribute('width') || node.getAttribute('style')?.includes('width'))
  },
  replacement: (_content: string, node: HTMLElement) => {
    const img = node as HTMLImageElement
    const alt = img.alt || 'image'
    const src = img.src
    const width = img.getAttribute('width') || img.style.width?.replace('px', '')
    const height = img.getAttribute('height') || img.style.height?.replace('px', '')

    if (width || height) {
      const style = [
        width ? `width="${width}"` : '',
        height ? `height="${height}"` : ''
      ].filter(Boolean).join(' ')
      return `<img src="${src}" alt="${alt}" ${style} />`
    }
    return `![${alt}](${src})`
  }
})

// Handle centered divs - preserve <div align="center"> in Markdown
turndownService.addRule('centeredDiv', {
  filter: (node: HTMLElement): boolean => {
    return node.nodeName === 'DIV' && node.getAttribute('align') === 'center'
  },
  replacement: (content: string) => {
    // Preserve as HTML in Markdown
    return `<div align="center">\n\n${content.trim()}\n\n</div>\n\n`
  }
})

// Rendered HTML content with markdown source code hints
const renderedContent = computed(() => {
  const html = renderMarkdown(editorStore.content)
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['input'],
    ADD_ATTR: ['checked', 'type', 'disabled', 'style', 'data-md-source', 'data-md-type', 'align']
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
        addMarkdownSourceHints()
        initializeMermaid()
        setupImageHandlers()
        restoreSelection()
      }
    })
  }
}, { immediate: true })

// Add markdown source hints to elements
function addMarkdownSourceHints() {
  if (!editorElement.value) return

  // Add source hints for various markdown elements
  const mappings: { selector: string; getSource: (el: HTMLElement) => string; type: string }[] = [
    { selector: 'strong', getSource: (el) => `**${el.textContent}**`, type: 'bold' },
    { selector: 'em', getSource: (el) => `*${el.textContent}*`, type: 'italic' },
    { selector: 'del', getSource: (el) => `~~${el.textContent}~~`, type: 'strikethrough' },
    { selector: 'mark', getSource: (el) => `==${el.textContent}==`, type: 'highlight' },
    { selector: 'code:not(pre code)', getSource: (el) => `\`${el.textContent}\``, type: 'inline-code' },
    { selector: 'sub', getSource: (el) => `~${el.textContent}~`, type: 'subscript' },
    { selector: 'sup', getSource: (el) => `^${el.textContent}^`, type: 'superscript' },
    { selector: 'a', getSource: (el) => `[${el.textContent}](${(el as HTMLAnchorElement).href})`, type: 'link' },
    { selector: 'img', getSource: (el) => `![${(el as HTMLImageElement).alt || 'image'}](${(el as HTMLImageElement).src})`, type: 'image' },
    { selector: 'h1', getSource: (el) => `# ${el.textContent}`, type: 'heading' },
    { selector: 'h2', getSource: (el) => `## ${el.textContent}`, type: 'heading' },
    { selector: 'h3', getSource: (el) => `### ${el.textContent}`, type: 'heading' },
    { selector: 'h4', getSource: (el) => `#### ${el.textContent}`, type: 'heading' },
    { selector: 'h5', getSource: (el) => `##### ${el.textContent}`, type: 'heading' },
    { selector: 'h6', getSource: (el) => `###### ${el.textContent}`, type: 'heading' },
    { selector: 'blockquote', getSource: () => '> ...', type: 'blockquote' },
    { selector: 'hr', getSource: () => '---', type: 'hr' },
  ]

  for (const { selector, getSource, type } of mappings) {
    editorElement.value.querySelectorAll(selector).forEach(el => {
      const element = el as HTMLElement
      element.setAttribute('data-md-source', getSource(element))
      element.setAttribute('data-md-type', type)
    })
  }
}

// Setup image click handlers for selection
function setupImageHandlers() {
  if (!editorElement.value) return

  editorElement.value.querySelectorAll('img').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation()
      selectImage(img as HTMLImageElement)
    })
  })
}

// Select an image for resizing
function selectImage(img: HTMLImageElement) {
  // Deselect previous
  if (selectedImage.value) {
    selectedImage.value.classList.remove('selected-image')
  }

  selectedImage.value = img
  img.classList.add('selected-image')

  // Calculate position for resize handles
  const rect = img.getBoundingClientRect()
  const containerRect = editorElement.value!.getBoundingClientRect()

  imageResizeHandles.value = {
    x: rect.left - containerRect.left + editorElement.value!.scrollLeft,
    y: rect.top - containerRect.top + editorElement.value!.scrollTop,
    width: rect.width,
    height: rect.height
  }

  // Floating selection toolbar removed; no action needed
}

// Deselect image
function deselectImage() {
  if (selectedImage.value) {
    selectedImage.value.classList.remove('selected-image')
    selectedImage.value = null
  }
  imageResizeHandles.value = null
}

// Start resizing image
function startImageResize(handle: string, e: MouseEvent) {
  if (!selectedImage.value) return

  e.preventDefault()
  e.stopPropagation()

  isResizing.value = true
  resizeStartData.value = {
    startX: e.clientX,
    startY: e.clientY,
    startWidth: selectedImage.value.offsetWidth,
    startHeight: selectedImage.value.offsetHeight,
    handle
  }

  document.addEventListener('mousemove', handleImageResize)
  document.addEventListener('mouseup', stopImageResize)
}

// Handle image resizing
function handleImageResize(e: MouseEvent) {
  if (!isResizing.value || !resizeStartData.value || !selectedImage.value) return

  const { startX, startY, startWidth, startHeight, handle } = resizeStartData.value
  const deltaX = e.clientX - startX
  const deltaY = e.clientY - startY

  let newWidth = startWidth
  let newHeight = startHeight
  const aspectRatio = startWidth / startHeight

  // Calculate new dimensions based on handle
  if (handle.includes('e')) {
    newWidth = Math.max(50, startWidth + deltaX)
  } else if (handle.includes('w')) {
    newWidth = Math.max(50, startWidth - deltaX)
  }

  if (handle.includes('s')) {
    newHeight = Math.max(50, startHeight + deltaY)
  } else if (handle.includes('n')) {
    newHeight = Math.max(50, startHeight - deltaY)
  }

  // Maintain aspect ratio for corner handles
  if (handle.length === 2) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      newHeight = newWidth / aspectRatio
    } else {
      newWidth = newHeight * aspectRatio
    }
  }

  // Apply new dimensions
  selectedImage.value.style.width = `${Math.round(newWidth)}px`
  selectedImage.value.style.height = `${Math.round(newHeight)}px`
  selectedImage.value.setAttribute('width', Math.round(newWidth).toString())
  selectedImage.value.setAttribute('height', Math.round(newHeight).toString())

  // Update handles position
  const rect = selectedImage.value.getBoundingClientRect()
  const containerRect = editorElement.value!.getBoundingClientRect()

  imageResizeHandles.value = {
    x: rect.left - containerRect.left + editorElement.value!.scrollLeft,
    y: rect.top - containerRect.top + editorElement.value!.scrollTop,
    width: rect.width,
    height: rect.height
  }
}

// Stop image resizing
function stopImageResize() {
  if (isResizing.value) {
    isResizing.value = false
    resizeStartData.value = null
    document.removeEventListener('mousemove', handleImageResize)
    document.removeEventListener('mouseup', stopImageResize)
    handleInput()
  }
}

// Initialize mermaid diagrams
async function initializeMermaid() {
  const mermaidElements = editorElement.value?.querySelectorAll('.mermaid')
  if (mermaidElements && mermaidElements.length > 0) {
    const mermaid = await import('mermaid')
    mermaid.default.init(undefined, mermaidElements as NodeListOf<HTMLElement>)
  }
}

// Save current cursor position
function saveSelection() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !editorElement.value) return

  const range = selection.getRangeAt(0)
  if (!editorElement.value.contains(range.commonAncestorContainer)) return

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
  { pattern: /\*\*([^*]+)\*\*$/, replacement: '<strong>$1</strong>' },
  { pattern: /__([^_]+)__$/, replacement: '<strong>$1</strong>' },
  { pattern: /(?<!\*)\*([^*]+)\*(?!\*)$/, replacement: '<em>$1</em>' },
  { pattern: /(?<!_)_([^_]+)_(?!_)$/, replacement: '<em>$1</em>' },
  { pattern: /~~([^~]+)~~$/, replacement: '<del>$1</del>' },
  { pattern: /==([^=]+)==$/, replacement: '<mark>$1</mark>' },
  { pattern: /`([^`]+)`$/, replacement: '<code>$1</code>' },
  { pattern: /(?<!~)~([^~]+)~(?!~)$/, replacement: '<sub>$1</sub>' },
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
      const fullMatch = match[0]
      const startIdx = cursorPos - fullMatch.length

      const temp = document.createElement('div')
      temp.innerHTML = fullMatch.replace(pattern, replacement)
      const newElement = temp.firstChild

      if (newElement) {
        const beforeText = text.substring(0, startIdx)
        const afterText = text.substring(cursorPos)

        const parent = textNode.parentNode
        if (!parent) return false

        const beforeNode = document.createTextNode(beforeText)
        const afterNode = document.createTextNode(afterText)

        parent.insertBefore(beforeNode, textNode)
        parent.insertBefore(newElement, textNode)
        parent.insertBefore(afterNode, textNode)
        parent.removeChild(textNode)

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

  checkAndRenderMarkdown()

  const html = editorElement.value.innerHTML
  const markdown = turndownService.turndown(html)

  editorStore.setContent(markdown)

  if (collaboration) {
    const info = getSelectionInfo()
    if (info) {
      collaboration.touchEditing(info.line, info.start)
    }
  }

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
  document.execCommand('removeFormat', false)
}

// Toggle center alignment using <div align="center">
function toggleCenterAlign() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)

  // Check if already inside a centered div
  let node: Node | null = range.startContainer
  let centeredDiv: HTMLElement | null = null

  while (node && node !== editorElement.value) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (el.tagName === 'DIV' && el.getAttribute('align') === 'center') {
        centeredDiv = el
        break
      }
    }
    node = node.parentNode
  }

  if (centeredDiv) {
    // Remove centering - unwrap the div
    const parent = centeredDiv.parentNode
    if (parent) {
      while (centeredDiv.firstChild) {
        parent.insertBefore(centeredDiv.firstChild, centeredDiv)
      }
      parent.removeChild(centeredDiv)
    }
  } else {
    // Wrap selection in centered div
    const contents = range.extractContents()
    const div = document.createElement('div')
    div.setAttribute('align', 'center')
    div.appendChild(contents)
    range.insertNode(div)

    // Move cursor after the div
    const newRange = document.createRange()
    newRange.setStartAfter(div)
    newRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(newRange)
  }
}

// Handle keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  const ctrl = event.ctrlKey || event.metaKey

  if (collaboration) {
    const info = getSelectionInfo()
    if (info && collaboration.isLineLocked(info.line)) {
      if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Enter' || event.key === 'Tab' || ctrl) {
        event.preventDefault()
        showLockWarning()
        return
      }
    }
  }

  if (ctrl && event.key === 'b') {
    event.preventDefault()
    document.execCommand('bold', false)
    handleInput()
    return
  }

  if (ctrl && event.key === 'i') {
    event.preventDefault()
    document.execCommand('italic', false)
    handleInput()
    return
  }

  if (ctrl && event.key === 'u') {
    event.preventDefault()
    document.execCommand('underline', false)
    handleInput()
    return
  }

  // Cmd/Ctrl+E: Toggle center alignment
  if (ctrl && event.key === 'e') {
    event.preventDefault()
    toggleCenterAlign()
    handleInput()
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const listItem = range.startContainer.parentElement?.closest('li')
      if (listItem) {
        if (event.shiftKey) {
          document.execCommand('outdent', false)
        } else {
          document.execCommand('indent', false)
        }
        handleInput()
      } else {
        document.execCommand('insertText', false, '\t')
        handleInput()
      }
    }
  }

  if (event.key === 'Enter' && !event.shiftKey) {
    setTimeout(() => {
      clearFormattingForNewLine()
      handleInput()
    }, 0)
  }

  // Escape to deselect image (floating toolbar removed)
  if (event.key === 'Escape') {
    deselectImage()
  }
}

// Handle paste
async function handlePaste(event: ClipboardEvent) {
  if (!event.clipboardData) return

  if (collaboration) {
    const info = getSelectionInfo()
    if (info && collaboration.isLineLocked(info.line)) {
      event.preventDefault()
      showLockWarning()
      return
    }
  }

  if (hasImageInClipboard(event.clipboardData)) {
    event.preventDefault()
    isUploading.value = true

    try {
      const result = await uploadImageFromClipboard(event.clipboardData)
      if (result && result.success && result.url) {
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

  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
  handleInput()
}

// Handle checkbox clicks
function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement

  // Handle checkbox
  if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
    setTimeout(() => handleInput(), 0)
    return
  }

  // Handle image click
  if (target.tagName === 'IMG') {
    selectImage(target as HTMLImageElement)
    return
  }

  // Deselect image when clicking elsewhere
  if (selectedImage.value && target !== selectedImage.value) {
    deselectImage()
  }
}

// Handle mouse up for selection toolbar
function handleMouseUp(event: MouseEvent) {
  // Don't show toolbar if clicking on toolbar itself
  if ((event.target as HTMLElement).closest('.selection-toolbar')) return

  // Don't show if image is selected
  if (selectedImage.value) return

  // Selection toolbar removed: no action on mouseup
  return
}

// Handle selection change for collaboration
function handleSelectionChange() {
  if (!collaboration) return
  const info = getSelectionInfo()
  if (!info) return

  collaboration.updateCursor(info.line, info.column, info.start)
  if (info.start !== info.end) {
    collaboration.updateSelection(info.start, info.end)
  }
}

function handleBeforeInput(event: InputEvent) {
  if (!collaboration) return
  const info = getSelectionInfo()
  if (!info) return
  if (collaboration.isLineLocked(info.line)) {
    event.preventDefault()
    showLockWarning()
  }
}

function handleScroll() {
  if (!editorElement.value) return
  scrollTop.value = editorElement.value.scrollTop
  scrollLeft.value = editorElement.value.scrollLeft
}

function showLockWarning() {
  lockWarning.value = true
  window.setTimeout(() => {
    lockWarning.value = false
  }, 1200)
}

function getSelectionInfo() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !editorElement.value) return null

  const range = selection.getRangeAt(0)
  if (!editorElement.value.contains(range.commonAncestorContainer)) return null

  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(editorElement.value)
  preCaretRange.setEnd(range.startContainer, range.startOffset)
  const start = preCaretRange.toString().length

  preCaretRange.setEnd(range.endContainer, range.endOffset)
  const end = preCaretRange.toString().length

  const textBeforeCursor = editorElement.value.innerText.substring(0, start)
  const lines = textBeforeCursor.split('\n')
  const line = lines.length
  const column = lines[lines.length - 1].length + 1

  return { start, end, line, column }
}

function getCursorStyle(user: CollaborationUser) {
  if (!user.cursor || !editorElement.value) return {}
  const index = user.cursor.index ?? 0
  const rect = getCaretRectFromIndex(editorElement.value, index)
  if (!rect) return {}

  const containerRect = editorElement.value.getBoundingClientRect()
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
  if (!editorElement.value) return {}
  const index = lock.user.activity?.index ?? lock.user.cursor?.index ?? 0
  const rect = getCaretRectFromIndex(editorElement.value, index)
  if (!rect) return {}

  const containerRect = editorElement.value.getBoundingClientRect()
  const top = rect.top - containerRect.top
  const left = rect.right - containerRect.left + 6

  return {
    top: `${top}px`,
    left: `${left}px`,
    borderColor: lock.user.color,
    color: lock.user.color
  }
}

// Handle cursor move - show/hide source hints
function handleCursorMove() {
  if (!editorElement.value) return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)

  // Remove previous active hints
  editorElement.value.querySelectorAll('.show-source').forEach(el => {
    el.classList.remove('show-source')
  })

  // Find parent element with markdown source
  let node: Node | null = range.startContainer
  while (node && node !== editorElement.value) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      if (element.hasAttribute('data-md-source')) {
        element.classList.add('show-source')
        break
      }
    }
    node = node.parentNode
  }
}

// Expose sync method for external use
function syncToMarkdown() {
  handleInput()
}

defineExpose({
  syncToMarkdown
})

onMounted(() => {
  if (editorElement.value) {
    editorElement.value.innerHTML = renderedContent.value
    addMarkdownSourceHints()
    initializeMermaid()
    setupImageHandlers()
  }

  document.addEventListener('selectionchange', handleSelectionChange)
  document.addEventListener('selectionchange', handleCursorMove)
})

onUnmounted(() => {
  document.removeEventListener('selectionchange', handleSelectionChange)
  document.removeEventListener('selectionchange', handleCursorMove)
  document.removeEventListener('mousemove', handleImageResize)
  document.removeEventListener('mouseup', stopImageResize)
})
</script>

<template>
  <div class="wysiwyg-editor-container">
    <div
      id="write"
      ref="editorElement"
      class="wysiwyg-editor markdown-body"
      contenteditable="true"
      spellcheck="true"
      @beforeinput="handleBeforeInput"
      @input="handleInput"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      @keydown="handleKeydown"
      @paste="handlePaste"
      @click="handleClick"
      @mouseup="handleMouseUp"
      @scroll="handleScroll"
    />

    <!-- Floating selection toolbar removed -->

    <!-- Image Resize Handles -->
    <div
      v-if="imageResizeHandles && selectedImage"
      class="image-resize-container"
      :style="{
        left: `${imageResizeHandles.x}px`,
        top: `${imageResizeHandles.y}px`,
        width: `${imageResizeHandles.width}px`,
        height: `${imageResizeHandles.height}px`
      }"
    >
      <div class="resize-handle nw" @mousedown="startImageResize('nw', $event)"></div>
      <div class="resize-handle n" @mousedown="startImageResize('n', $event)"></div>
      <div class="resize-handle ne" @mousedown="startImageResize('ne', $event)"></div>
      <div class="resize-handle w" @mousedown="startImageResize('w', $event)"></div>
      <div class="resize-handle e" @mousedown="startImageResize('e', $event)"></div>
      <div class="resize-handle sw" @mousedown="startImageResize('sw', $event)"></div>
      <div class="resize-handle s" @mousedown="startImageResize('s', $event)"></div>
      <div class="resize-handle se" @mousedown="startImageResize('se', $event)"></div>

      <!-- Image source hint -->
      <div class="image-source-hint">
        {{ selectedImage.getAttribute('data-md-source') || `![](${selectedImage.src})` }}
      </div>
    </div>

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

    <!-- Upload indicator -->
    <div v-if="isUploading" class="upload-indicator">
      <span class="upload-spinner"></span>
      <span>上传图片中...</span>
    </div>

    <div v-if="lockWarning" class="lock-warning">
      该行正在被其他协作者编辑
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

.wysiwyg-editor:empty::before {
  content: '开始编写...';
  color: var(--text-tertiary);
}

.wysiwyg-editor:focus {
  outline: none;
}

/* Markdown source hints */
.wysiwyg-editor :deep([data-md-source]) {
  position: relative;
}

.wysiwyg-editor :deep([data-md-source].show-source)::before {
  content: attr(data-md-source);
  position: absolute;
  left: 0;
  top: -1.5em;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  padding: 1px 4px;
  border-radius: 2px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 5;
}

/* For inline elements, position differently */
.wysiwyg-editor :deep(strong.show-source)::before,
.wysiwyg-editor :deep(em.show-source)::before,
.wysiwyg-editor :deep(del.show-source)::before,
.wysiwyg-editor :deep(mark.show-source)::before,
.wysiwyg-editor :deep(code.show-source:not(pre code))::before,
.wysiwyg-editor :deep(sub.show-source)::before,
.wysiwyg-editor :deep(sup.show-source)::before {
  top: auto;
  bottom: 100%;
  margin-bottom: 2px;
}

/* Image selection styling */
.wysiwyg-editor :deep(img.selected-image) {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
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

.wysiwyg-editor :deep(input[type="checkbox"]) {
  margin-right: 0.5em;
  cursor: pointer;
}

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

.wysiwyg-editor :deep(:not(pre) > code) {
  background: var(--bg-tertiary);
  padding: 0.2em 0.4em;
  border-radius: var(--radius-sm);
}

.wysiwyg-editor :deep(blockquote) {
  border-left: 4px solid var(--accent-primary);
  margin: 1em 0;
  padding-left: 1em;
  color: var(--text-secondary);
}

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

.wysiwyg-editor :deep(a) {
  color: var(--accent-primary);
  text-decoration: none;
}

.wysiwyg-editor :deep(a:hover) {
  text-decoration: underline;
}

.wysiwyg-editor :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: outline 0.15s ease;
}

.wysiwyg-editor :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 2em 0;
}

.wysiwyg-editor :deep(mark) {
  background: #fff59d;
  padding: 0.1em 0.2em;
}

.wysiwyg-editor :deep(strong) {
  font-weight: 700;
}

.wysiwyg-editor :deep(em) {
  font-style: italic;
}

.wysiwyg-editor :deep(del) {
  text-decoration: line-through;
}

.wysiwyg-editor :deep(sub) {
  vertical-align: sub;
  font-size: smaller;
}

.wysiwyg-editor :deep(sup) {
  vertical-align: super;
  font-size: smaller;
}

/* Image resize container */
.image-resize-container {
  position: absolute;
  pointer-events: none;
  z-index: 10;
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--accent-primary);
  border: 1px solid white;
  border-radius: 2px;
  pointer-events: auto;
  z-index: 11;
}

.resize-handle.nw { top: -5px; left: -5px; cursor: nw-resize; }
.resize-handle.n { top: -5px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.resize-handle.ne { top: -5px; right: -5px; cursor: ne-resize; }
.resize-handle.w { top: 50%; left: -5px; transform: translateY(-50%); cursor: w-resize; }
.resize-handle.e { top: 50%; right: -5px; transform: translateY(-50%); cursor: e-resize; }
.resize-handle.sw { bottom: -5px; left: -5px; cursor: sw-resize; }
.resize-handle.s { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.resize-handle.se { bottom: -5px; right: -5px; cursor: se-resize; }

/* Image source hint */
.image-source-hint {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  max-width: 100%;
  padding: 4px 8px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

.collaborator-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 12;
}

.collaborator-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 12;
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

.lock-warning {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 6px 10px;
  font-size: 12px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  z-index: 30;
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

/* ========================================
   Responsive Styles for WYSIWYG Editor
   ======================================== */

@media screen and (max-width: 768px) {
  .wysiwyg-editor {
    padding: 16px;
    font-size: 15px;
    -webkit-overflow-scrolling: touch;
  }

  .wysiwyg-editor:empty::before {
    font-size: 14px;
  }

  /* Larger touch targets for images */
  .wysiwyg-editor :deep(img) {
    min-height: 44px;
  }

  /* Adjust code blocks */
  .wysiwyg-editor :deep(pre) {
    padding: 12px;
    font-size: 13px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Adjust tables for mobile */
  .wysiwyg-editor :deep(table) {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .wysiwyg-editor :deep(th),
  .wysiwyg-editor :deep(td) {
    padding: 8px;
    font-size: 14px;
    white-space: nowrap;
  }

  /* Adjust blockquote */
  .wysiwyg-editor :deep(blockquote) {
    margin: 0.5em 0;
    padding-left: 12px;
    font-size: 14px;
  }

  /* Larger resize handles for touch */
  .resize-handle {
    width: 16px;
    height: 16px;
  }

  .resize-handle.nw { top: -8px; left: -8px; }
  .resize-handle.n { top: -8px; }
  .resize-handle.ne { top: -8px; right: -8px; }
  .resize-handle.w { left: -8px; }
  .resize-handle.e { right: -8px; }
  .resize-handle.sw { bottom: -8px; left: -8px; }
  .resize-handle.s { bottom: -8px; }
  .resize-handle.se { bottom: -8px; right: -8px; }

  /* Hide source hints on mobile - too cluttered */
  .wysiwyg-editor :deep([data-md-source].show-source)::before {
    display: none;
  }

  .image-source-hint {
    font-size: 10px;
    padding: 2px 6px;
  }

  /* Upload indicator */
  .upload-indicator {
    padding: 10px 16px;
    font-size: 13px;
  }
}

@media screen and (max-width: 480px) {
  .wysiwyg-editor {
    padding: 12px;
    font-size: 14px;
  }

  .wysiwyg-editor :deep(h1) {
    font-size: 1.5em;
  }

  .wysiwyg-editor :deep(h2) {
    font-size: 1.3em;
  }

  .wysiwyg-editor :deep(h3) {
    font-size: 1.1em;
  }

  .wysiwyg-editor :deep(pre) {
    font-size: 12px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .wysiwyg-editor :deep(a) {
    /* Prevent accidental link activation */
    -webkit-touch-callout: none;
  }

  .wysiwyg-editor :deep(img) {
    /* Better touch feedback */
    -webkit-tap-highlight-color: transparent;
  }

  /* Make resize handles more visible on touch */
  .resize-handle {
    background: var(--accent-primary);
    opacity: 0.9;
  }
}
</style>
