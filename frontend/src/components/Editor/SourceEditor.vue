<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useEditorStore } from '@/stores/editor'

const editorStore = useEditorStore()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const lineNumbers = ref<number[]>([1])

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
  <div class="source-editor">
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

.editor-textarea {
  flex: 1;
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
</style>
