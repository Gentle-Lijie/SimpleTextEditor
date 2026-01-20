import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EditorMode } from '@/types'

export const useEditorStore = defineStore('editor', () => {
  // State
  const content = ref('# Welcome to SimpleTextEditor\n\nStart typing your markdown here...\n\n## Features\n\n- **Real-time collaboration**\n- Markdown rendering\n- Code highlighting\n- And more!\n\n```javascript\nconsole.log("Hello, World!");\n```\n')
  const mode = ref<EditorMode>('split')
  const isDirty = ref(false)
  const isSaving = ref(false)
  const cursorLine = ref(1)
  const cursorColumn = ref(1)

  // Computed
  const wordCount = computed(() => {
    const text = content.value.trim()
    if (!text) return 0
    // Count Chinese characters and English words
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = text.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(w => w.length > 0).length
    return chineseChars + englishWords
  })

  const charCount = computed(() => content.value.length)

  const readingTime = computed(() => {
    // Average reading speed: 200 words per minute for Chinese, 250 for English
    const minutes = Math.ceil(wordCount.value / 200)
    return minutes < 1 ? '< 1' : String(minutes)
  })

  // Actions
  function setContent(newContent: string) {
    content.value = newContent
    isDirty.value = true
  }

  function setMode(newMode: EditorMode) {
    mode.value = newMode
  }

  function setCursorPosition(line: number, column: number) {
    cursorLine.value = line
    cursorColumn.value = column
  }

  function markSaved() {
    isDirty.value = false
    isSaving.value = false
  }

  function startSaving() {
    isSaving.value = true
  }

  return {
    // State
    content,
    mode,
    isDirty,
    isSaving,
    cursorLine,
    cursorColumn,
    // Computed
    wordCount,
    charCount,
    readingTime,
    // Actions
    setContent,
    setMode,
    setCursorPosition,
    markSaved,
    startSaving
  }
})
