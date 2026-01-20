<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import Editor from '@/components/Editor/Editor.vue'
import Toolbar from '@/components/Toolbar/Toolbar.vue'
import type { EditorMode } from '@/types'
import {
  markdownWrappers,
  getHeadingPrefix,
  getListPrefix,
  getInsertTemplate,
  getColorWrapper
} from '@/utils/shortcuts'

const editorStore = useEditorStore()
const editorRef = ref<InstanceType<typeof Editor> | null>(null)

// Mode switching
function setMode(mode: EditorMode) {
  editorStore.setMode(mode)
}

// Mode labels
const modeLabels: Record<EditorMode, string> = {
  source: '源码',
  preview: '预览',
  split: '分屏',
  wysiwyg: 'WYSIWYG'
}

// Handle toolbar commands
function handleCommand(command: string, value?: string) {
  const sourceEditor = editorRef.value?.getSourceEditor()
  if (!sourceEditor) return

  const textarea = sourceEditor.getTextarea()
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const content = textarea.value
  const selectedText = content.substring(start, end)

  let newContent = content
  let newCursorPos = start

  // Handle different commands
  if (command in markdownWrappers) {
    const wrapper = markdownWrappers[command]
    const wrappedText = wrapper.before + (selectedText || '文字') + wrapper.after
    newContent = content.substring(0, start) + wrappedText + content.substring(end)
    newCursorPos = start + wrapper.before.length + (selectedText ? selectedText.length : 2)
  } else if (command === 'heading') {
    const level = parseInt(value || '0')
    const lineStart = content.lastIndexOf('\n', start - 1) + 1
    const lineEnd = content.indexOf('\n', end)
    const actualLineEnd = lineEnd === -1 ? content.length : lineEnd
    const lineContent = content.substring(lineStart, actualLineEnd)

    // Remove existing heading prefix
    const cleanLine = lineContent.replace(/^#{1,6}\s*/, '')
    const prefix = getHeadingPrefix(level)

    newContent = content.substring(0, lineStart) + prefix + cleanLine + content.substring(actualLineEnd)
    newCursorPos = lineStart + prefix.length + cleanLine.length
  } else if (command === 'list') {
    const listType = value || 'ul'
    const prefix = getListPrefix(listType)
    const lineStart = content.lastIndexOf('\n', start - 1) + 1

    newContent = content.substring(0, lineStart) + prefix + content.substring(lineStart)
    newCursorPos = lineStart + prefix.length
  } else if (command === 'insert') {
    const template = getInsertTemplate(value || '')
    newContent = content.substring(0, start) + template + content.substring(end)
    newCursorPos = start + template.length
  } else if (command === 'textColor' || command === 'bgColor') {
    const wrapper = getColorWrapper(command, value || '#000000')
    if (wrapper.before) {
      const wrappedText = wrapper.before + (selectedText || '文字') + wrapper.after
      newContent = content.substring(0, start) + wrappedText + content.substring(end)
      newCursorPos = start + wrapper.before.length + (selectedText ? selectedText.length : 2)
    }
  }

  // Update content
  editorStore.setContent(newContent)

  // Restore focus and cursor position
  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  })
}

// Global keyboard shortcuts
function handleGlobalKeydown(event: KeyboardEvent) {
  const ctrl = event.ctrlKey || event.metaKey

  // Ctrl+/ : Toggle mode
  if (ctrl && event.key === '/') {
    event.preventDefault()
    const modes: EditorMode[] = ['source', 'split', 'preview']
    const currentIndex = modes.indexOf(editorStore.mode)
    const nextIndex = (currentIndex + 1) % modes.length
    setMode(modes[nextIndex])
  }

  // Ctrl+S : Save (placeholder)
  if (ctrl && event.key === 's') {
    event.preventDefault()
    // TODO: Implement save functionality
    console.log('Save triggered')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div id="app-container">
    <header class="app-header">
      <div class="header-left">
        <div class="logo">SimpleTextEditor</div>
      </div>
      <div class="header-center">
        <div class="mode-switcher">
          <button
            v-for="mode in (['source', 'preview', 'split'] as EditorMode[])"
            :key="mode"
            class="mode-btn"
            :class="{ active: editorStore.mode === mode }"
            @click="setMode(mode)"
          >
            {{ modeLabels[mode] }}
          </button>
        </div>
      </div>
      <div class="header-right">
        <span class="save-status" :class="{ saving: editorStore.isSaving, dirty: editorStore.isDirty }">
          {{ editorStore.isSaving ? '保存中...' : editorStore.isDirty ? '未保存' : '已保存' }}
        </span>
      </div>
    </header>

    <Toolbar @command="handleCommand" />

    <main class="app-main">
      <Editor ref="editorRef" />
    </main>

    <footer class="app-footer">
      <div class="status-bar">
        <span class="status-item">
          行 {{ editorStore.cursorLine }}, 列 {{ editorStore.cursorColumn }}
        </span>
        <span class="status-divider">|</span>
        <span class="status-item">
          {{ editorStore.charCount }} 字符
        </span>
        <span class="status-divider">|</span>
        <span class="status-item">
          {{ editorStore.wordCount }} 词
        </span>
        <span class="status-divider">|</span>
        <span class="status-item">
          阅读时间 ~{{ editorStore.readingTime }} 分钟
        </span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
#app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 48px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header-left,
.header-right {
  flex: 1;
  display: flex;
  align-items: center;
}

.header-right {
  justify-content: flex-end;
}

.header-center {
  display: flex;
  justify-content: center;
}

.logo {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.mode-switcher {
  display: flex;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 2px;
}

.mode-btn {
  padding: 6px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}

.mode-btn:hover {
  color: var(--text-primary);
}

.mode-btn.active {
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.save-status {
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.save-status.dirty {
  color: var(--accent-warning);
}

.save-status.saving {
  color: var(--accent-primary);
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-footer {
  height: 24px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.status-bar {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 100%;
  font-size: 12px;
  color: var(--text-secondary);
}

.status-item {
  white-space: nowrap;
}

.status-divider {
  margin: 0 8px;
  color: var(--border-color);
}
</style>
