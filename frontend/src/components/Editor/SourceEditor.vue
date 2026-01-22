<script setup lang="ts">
import { ref, watch, onMounted, nextTick, inject, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type { CollaborationUser } from '@/types'
import { uploadImageFromClipboard, hasImageInClipboard, generateImageMarkdown } from '@/utils/imageUpload'

const editorStore = useEditorStore()
const isUploading = ref(false)

// Get collaboration from parent
const collaboration = inject<any>('collaboration')

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const lineNumbers = ref<number[]>([1])
const editorContainerRef = ref<HTMLDivElement | null>(null)
const scrollTop = ref(0)
const scrollLeft = ref(0)
const lockWarning = ref(false)

// Collaboration users with cursor positions
const collaboratorCursors = computed(() => {
  if (!collaboration) return []
  return collaboration.users.value.filter((u: CollaborationUser) => u.cursor)
})

const lockedLines = computed(() => {
  if (!collaboration || !collaboration.getLockedLines) return []
  return collaboration.getLockedLines()
})

// Update line numbers when content changes
function updateLineNumbers() {
  const lines = editorStore.content.split('\n').length
  lineNumbers.value = Array.from({ length: lines }, (_, i) => i + 1)
}

function showLockWarning() {
  lockWarning.value = true
  window.setTimeout(() => {
    lockWarning.value = false
  }, 1200)
}

function getLineAndColumnFromIndex(text: string, index: number) {
  const before = text.substring(0, index)
  const lines = before.split('\n')
  const line = lines.length
  const column = lines[lines.length - 1].length + 1
  return { line, column }
}

function getCurrentLineIndex() {
  if (!textareaRef.value) return { line: 1, index: 0 }
  const textarea = textareaRef.value
  const index = textarea.selectionStart
  const { line } = getLineAndColumnFromIndex(textarea.value, index)
  return { line, index }
}

// Handle input
function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  editorStore.setContent(target.value)
  updateLineNumbers()

  if (collaboration) {
    const { line, index } = getCurrentLineIndex()
    collaboration.touchEditing(line, index)
  }
}

// Handle cursor position change
function handleCursorChange() {
  if (!textareaRef.value) return

  const textarea = textareaRef.value
  const text = textarea.value.substring(0, textarea.selectionStart)
  const lines = text.split('\n')
  const line = lines.length
  const column = lines[lines.length - 1].length + 1

  editorStore.setCursorPosition(line, column)

  // Update collaboration cursor
  if (collaboration) {
    collaboration.updateCursor(line, column, textarea.selectionStart)
    if (textarea.selectionStart !== textarea.selectionEnd) {
      collaboration.updateSelection(textarea.selectionStart, textarea.selectionEnd)
    }
  }
}

function handleBeforeInput(event: InputEvent) {
  if (!collaboration) return
  const { line } = getCurrentLineIndex()
  if (collaboration.isLineLocked(line)) {
    event.preventDefault()
    showLockWarning()
  }
}

// Handle keyboard shortcuts
function handleKeyDown(event: KeyboardEvent) {
  const textarea = textareaRef.value
  if (!textarea) return

  if (collaboration) {
    const { line } = getCurrentLineIndex()
    if (collaboration.isLineLocked(line)) {
      if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        showLockWarning()
        return
      }
    }
  }

  // Tab key - insert spaces instead of tab character
  if (event.key === 'Tab') {
    event.preventDefault()
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value

    if (event.shiftKey) {
      // Shift+Tab: remove indent
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const lineContent = value.substring(lineStart, start)
      if (lineContent.startsWith('  ')) {
        textarea.value = value.substring(0, lineStart) + value.substring(lineStart + 2)
        textarea.selectionStart = textarea.selectionEnd = start - 2
        editorStore.setContent(textarea.value)
      }
    } else {
      // Tab: add indent
      textarea.value = value.substring(0, start) + '  ' + value.substring(end)
      textarea.selectionStart = textarea.selectionEnd = start + 2
      editorStore.setContent(textarea.value)
    }
    updateLineNumbers()
  }

  // Ctrl/Cmd + B: Bold
  if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
    event.preventDefault()
    wrapSelection('**', '**')
  }

  // Ctrl/Cmd + I: Italic
  if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
    event.preventDefault()
    wrapSelection('*', '*')
  }

  // Ctrl/Cmd + K: Link
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    const textarea = textareaRef.value!
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end) || 'link text'
    const before = textarea.value.substring(0, start)
    const after = textarea.value.substring(end)
    textarea.value = `${before}[${selectedText}](url)${after}`
    editorStore.setContent(textarea.value)
  }

  // Ctrl/Cmd + E: Center (toggle <div align="center">)
  if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
    event.preventDefault()
    toggleCenterAlign()
  }
}

// Toggle center alignment with <div align="center">
function toggleCenterAlign() {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value

  // Find the line(s) containing the selection
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  let lineEnd = value.indexOf('\n', end)
  if (lineEnd === -1) lineEnd = value.length

  const selectedLines = value.substring(lineStart, lineEnd)

  // Check if already centered
  const centerStartMatch = value.substring(0, lineStart).match(/<div align="center">\s*\n?$/)
  const centerEndMatch = value.substring(lineEnd).match(/^\s*\n?<\/div>/)

  if (centerStartMatch && centerEndMatch) {
    // Remove centering
    const beforeCenter = value.substring(0, lineStart - centerStartMatch[0].length)
    const afterCenter = value.substring(lineEnd + centerEndMatch[0].length)
    textarea.value = beforeCenter + selectedLines + afterCenter
    editorStore.setContent(textarea.value)
    // Adjust cursor position
    const newStart = start - centerStartMatch[0].length
    textarea.selectionStart = Math.max(0, newStart)
    textarea.selectionEnd = Math.max(0, newStart + (end - start))
  } else {
    // Add centering
    const before = value.substring(0, lineStart)
    const after = value.substring(lineEnd)
    textarea.value = `${before}<div align="center">\n\n${selectedLines}\n\n</div>${after}`
    editorStore.setContent(textarea.value)
    // Position cursor inside the centered area
    const newStart = lineStart + '<div align="center">\n\n'.length
    textarea.selectionStart = newStart
    textarea.selectionEnd = newStart + selectedLines.length
  }
  textarea.focus()
}

// Wrap selected text with markers
function wrapSelection(before: string, after: string) {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const selectedText = value.substring(start, end)

  textarea.value = value.substring(0, start) + before + selectedText + after + value.substring(end)
  textarea.selectionStart = start + before.length
  textarea.selectionEnd = end + before.length
  editorStore.setContent(textarea.value)
  textarea.focus()
}

// Sync scroll with line numbers
function handleScroll(event: Event) {
  const target = event.target as HTMLTextAreaElement
  scrollTop.value = target.scrollTop
  scrollLeft.value = target.scrollLeft
  const lineNumbersEl = document.querySelector('.line-numbers') as HTMLElement
  if (lineNumbersEl) {
    lineNumbersEl.scrollTop = target.scrollTop
  }
}

// Handle paste - check for images
async function handlePaste(event: ClipboardEvent) {
  if (!event.clipboardData || !textareaRef.value) return

  if (collaboration) {
    const { line } = getCurrentLineIndex()
    if (collaboration.isLineLocked(line)) {
      event.preventDefault()
      showLockWarning()
      return
    }
  }

  // Check if clipboard has image
  if (hasImageInClipboard(event.clipboardData)) {
    event.preventDefault()
    isUploading.value = true

    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const value = textarea.value

    // Insert placeholder
    const placeholder = '![上传中...]()'
    textarea.value = value.substring(0, start) + placeholder + value.substring(start)
    editorStore.setContent(textarea.value)

    try {
      const result = await uploadImageFromClipboard(event.clipboardData)
      if (result && result.success && result.url) {
        // Replace placeholder with actual image markdown
        const imageMarkdown = generateImageMarkdown(result.url, 'image')
        const currentValue = textarea.value
        const placeholderIndex = currentValue.indexOf(placeholder)
        if (placeholderIndex !== -1) {
          textarea.value = currentValue.substring(0, placeholderIndex) +
            imageMarkdown +
            currentValue.substring(placeholderIndex + placeholder.length)
          editorStore.setContent(textarea.value)
        }
      } else {
        // Remove placeholder on error
        const currentValue = textarea.value
        const placeholderIndex = currentValue.indexOf(placeholder)
        if (placeholderIndex !== -1) {
          textarea.value = currentValue.substring(0, placeholderIndex) +
            currentValue.substring(placeholderIndex + placeholder.length)
          editorStore.setContent(textarea.value)
        }
        console.error('Image upload failed:', result?.error)
        alert('图片上传失败: ' + (result?.error || '未知错误'))
      }
    } catch (error) {
      console.error('Image upload error:', error)
      // Remove placeholder
      const currentValue = textarea.value
      const placeholderIndex = currentValue.indexOf(placeholder)
      if (placeholderIndex !== -1) {
        textarea.value = currentValue.substring(0, placeholderIndex) +
          currentValue.substring(placeholderIndex + placeholder.length)
        editorStore.setContent(textarea.value)
      }
      alert('图片上传出错')
    } finally {
      isUploading.value = false
      updateLineNumbers()
    }
  }
}

// Calculate cursor position in pixels for collaborators
function getCursorStyle(user: CollaborationUser) {
  if (!user.cursor || !textareaRef.value) return {}

  const { line, column } = user.cursor

  // Calculate position based on line and column
  const lineHeight = 22.4 // Should match CSS
  const charWidth = 8.4 // Approximate for monospace

  const top = (line - 1) * lineHeight + 12 // 12px padding
  const left = 50 + 16 + (column - 1) * charWidth // 50px line numbers + 16px padding

  return {
    top: `${top - scrollTop.value}px`,
    left: `${left - scrollLeft.value}px`,
    backgroundColor: user.color,
    '--user-color': user.color
  }
}

function getLockedLineStyle(line: number) {
  const lineHeight = 22.4
  const top = (line - 1) * lineHeight + 12
  return {
    top: `${top - scrollTop.value}px`,
    height: `${lineHeight}px`
  }
}

function getLockedLineMarkerStyle(line: number) {
  const lineHeight = 22.4
  const top = (line - 1) * lineHeight + 12
  return {
    top: `${top - scrollTop.value}px`,
    right: '12px'
  }
}

// Initialize
onMounted(() => {
  updateLineNumbers()
  nextTick(() => {
    textareaRef.value?.focus()
  })
})

watch(() => editorStore.content, () => {
  updateLineNumbers()
})

// Expose methods for external use
defineExpose({
  wrapSelection,
  getTextarea: () => textareaRef.value
})
</script>

<template>
  <div class="source-editor" ref="editorContainerRef">
    <div class="line-numbers">
      <div
        v-for="num in lineNumbers"
        :key="num"
        class="line-number"
        :class="{ active: num === editorStore.cursorLine }"
      >
        {{ num }}
      </div>
    </div>
    <div class="editor-wrapper">
      <div class="locked-lines-layer">
        <div
          v-for="lock in lockedLines"
          :key="`${lock.line}-${lock.ownerId}`"
          class="locked-line"
          :style="getLockedLineStyle(lock.line)"
        ></div>
        <div
          v-for="lock in lockedLines"
          :key="`marker-${lock.line}-${lock.ownerId}`"
          class="locked-line-marker"
          :style="{ ...getLockedLineMarkerStyle(lock.line), borderColor: lock.user.color, color: lock.user.color }"
        >
          {{ lock.user.name }} 正在编辑
        </div>
      </div>
      <textarea
        ref="textareaRef"
        class="editor-textarea"
        :value="editorStore.content"
        @beforeinput="handleBeforeInput"
        @input="handleInput"
        @keydown="handleKeyDown"
        @click="handleCursorChange"
        @keyup="handleCursorChange"
        @scroll="handleScroll"
        @paste="handlePaste"
        spellcheck="false"
        placeholder="Start typing your markdown here..."
      ></textarea>

      <!-- Upload indicator -->
      <div v-if="isUploading" class="upload-indicator">
        <span class="upload-spinner"></span>
        <span>上传图片中...</span>
      </div>

      <div v-if="lockWarning" class="lock-warning">
        该行正在被其他协作者编辑
      </div>

      <!-- Collaborator cursors -->
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
    </div>
  </div>
</template>

<style scoped>
.source-editor {
  display: flex;
  height: 100%;
  background: var(--editor-bg);
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.6;
}

.line-numbers {
  flex-shrink: 0;
  width: 50px;
  padding: 12px 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  text-align: right;
  overflow: hidden;
  user-select: none;
}

.line-number {
  padding: 0 12px 0 8px;
  color: var(--editor-line-number);
  height: 22.4px; /* line-height * font-size */
}

.line-number.active {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.editor-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.locked-lines-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
}

.locked-line {
  position: absolute;
  left: 0;
  right: 0;
  background: rgba(255, 167, 38, 0.15);
  border-left: 2px solid rgba(255, 167, 38, 0.6);
}

.locked-line-marker {
  position: absolute;
  padding: 2px 6px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid;
  border-radius: 10px;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
}

.editor-textarea {
  width: 100%;
  height: 100%;
  padding: 12px 16px;
  border: none;
  outline: none;
  resize: none;
  background: var(--editor-bg);
  color: var(--text-primary);
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  tab-size: 2;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.editor-textarea::placeholder {
  color: var(--text-tertiary);
}

.editor-textarea::selection {
  background: var(--editor-selection);
}

/* Collaborator cursor styles */
.collaborator-cursor {
  position: absolute;
  pointer-events: none;
  z-index: 10;
}

.cursor-line {
  width: 2px;
  height: 22.4px;
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

/* Responsive Styles */
@media screen and (max-width: 768px) {
  .source-editor {
    font-size: 14px;
  }

  .line-numbers {
    width: 40px;
    padding: 10px 0;
  }

  .line-number {
    padding: 0 8px 0 6px;
    height: 19.6px;
  }

  .editor-textarea {
    padding: 10px 12px;
    -webkit-overflow-scrolling: touch;
  }

  .cursor-line {
    height: 19.6px;
  }

  .upload-indicator {
    padding: 10px 16px;
    font-size: 13px;
  }
}

@media screen and (max-width: 480px) {
  .source-editor {
    font-size: 13px;
  }

  .line-numbers {
    width: 36px;
  }

  .line-number {
    padding: 0 6px 0 4px;
    font-size: 11px;
  }

  .editor-textarea {
    padding: 8px 10px;
  }
}

/* Hide line numbers on very small screens to save space */
@media screen and (max-width: 380px) {
  .line-numbers {
    display: none;
  }
}
</style>
