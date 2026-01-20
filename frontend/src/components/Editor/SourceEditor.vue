<script setup lang="ts">
import { ref, watch, onMounted, nextTick, inject, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type { CollaborationUser } from '@/types'

const editorStore = useEditorStore()

// Get collaboration from parent
const collaboration = inject<any>('collaboration')

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const lineNumbers = ref<number[]>([1])
const editorContainerRef = ref<HTMLDivElement | null>(null)

// Collaboration users with cursor positions
const collaboratorCursors = computed(() => {
  if (!collaboration) return []
  return collaboration.users.value.filter((u: CollaborationUser) => u.cursor)
})

// Update line numbers when content changes
function updateLineNumbers() {
  const lines = editorStore.content.split('\n').length
  lineNumbers.value = Array.from({ length: lines }, (_, i) => i + 1)
}

// Handle input
function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  editorStore.setContent(target.value)
  updateLineNumbers()
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

// Handle keyboard shortcuts
function handleKeyDown(event: KeyboardEvent) {
  const textarea = textareaRef.value
  if (!textarea) return

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
  const lineNumbersEl = document.querySelector('.line-numbers') as HTMLElement
  if (lineNumbersEl) {
    lineNumbersEl.scrollTop = target.scrollTop
  }
}

// Calculate cursor position in pixels for collaborators
function getCursorStyle(user: CollaborationUser) {
  if (!user.cursor || !textareaRef.value) return {}

  const textarea = textareaRef.value
  const { line, column } = user.cursor

  // Calculate position based on line and column
  const lineHeight = 22.4 // Should match CSS
  const charWidth = 8.4 // Approximate for monospace

  const top = (line - 1) * lineHeight + 12 // 12px padding
  const left = 50 + 16 + (column - 1) * charWidth // 50px line numbers + 16px padding

  return {
    top: `${top}px`,
    left: `${left}px`,
    backgroundColor: user.color,
    '--user-color': user.color
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
      <textarea
        ref="textareaRef"
        class="editor-textarea"
        :value="editorStore.content"
        @input="handleInput"
        @keydown="handleKeyDown"
        @click="handleCursorChange"
        @keyup="handleCursorChange"
        @scroll="handleScroll"
        spellcheck="false"
        placeholder="Start typing your markdown here..."
      ></textarea>

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
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
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
</style>
