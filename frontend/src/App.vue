<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, provide } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useDocumentStore } from '@/stores/document'
import Editor from '@/components/Editor/Editor.vue'
import Toolbar from '@/components/Toolbar/Toolbar.vue'
import FileTree from '@/components/Sidebar/FileTree.vue'
import Outline from '@/components/Sidebar/Outline.vue'
import UserList from '@/components/Collaboration/UserList.vue'
import type { EditorMode } from '@/types'
import {
  markdownWrappers,
  getHeadingPrefix,
  getListPrefix,
  getInsertTemplate,
  getColorWrapper
} from '@/utils/shortcuts'
import { useCollaboration } from '@/composables/useCollaboration'

const editorStore = useEditorStore()
const documentStore = useDocumentStore()
const editorRef = ref<InstanceType<typeof Editor> | null>(null)

// Auto-save delay from env (default 3000ms)
const AUTO_SAVE_DELAY = parseInt(import.meta.env.VITE_AUTO_SAVE_DELAY || '3000')

// Sidebar state
const showSidebar = ref(true)
const sidebarTab = ref<'files' | 'outline' | 'collab'>('files')

// Collaboration - use computed ref so it updates when document changes
const currentDocId = computed(() => documentStore.currentDocument?.id || 'default')
const collaboration = useCollaboration(currentDocId)

// Provide collaboration for child components
provide('collaboration', collaboration)

// Connect to collaboration on mount
onMounted(() => {
  collaboration.connect()
})

// Mode switching
function setMode(mode: EditorMode) {
  editorStore.setMode(mode)
}

// Mode labels
const modeLabels: Record<EditorMode, string> = {
  source: '源码',
  preview: '预览',
  split: '分屏',
  wysiwyg: '所见即所得'
}

// Toggle sidebar
function toggleSidebar() {
  showSidebar.value = !showSidebar.value
}

// Handle toolbar commands - works for both source and WYSIWYG mode
function handleCommand(command: string, value?: string) {
  // If in WYSIWYG mode, use execCommand
  if (editorStore.mode === 'wysiwyg') {
    handleWYSIWYGCommand(command, value)
    return
  }

  // Source mode - manipulate markdown text
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

// Handle commands in WYSIWYG mode using execCommand
function handleWYSIWYGCommand(command: string, value?: string) {
  const wysiwygEditor = editorRef.value?.getWYSIWYGEditor()
  if (!wysiwygEditor) return

  // Map markdown commands to execCommand
  const execCommandMap: Record<string, () => void> = {
    bold: () => document.execCommand('bold', false),
    italic: () => document.execCommand('italic', false),
    underline: () => document.execCommand('underline', false),
    strikethrough: () => document.execCommand('strikeThrough', false),
    code: () => {
      // Wrap selection in code tag
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const code = document.createElement('code')
        code.appendChild(range.extractContents())
        range.insertNode(code)
      }
    }
  }

  if (command in execCommandMap) {
    execCommandMap[command]()
    wysiwygEditor.syncToMarkdown()
  } else if (command === 'heading') {
    const level = parseInt(value || '0')
    if (level === 0) {
      document.execCommand('formatBlock', false, 'p')
    } else {
      document.execCommand('formatBlock', false, `h${level}`)
    }
    wysiwygEditor.syncToMarkdown()
  } else if (command === 'list') {
    if (value === 'ul') {
      document.execCommand('insertUnorderedList', false)
    } else if (value === 'ol') {
      document.execCommand('insertOrderedList', false)
    }
    wysiwygEditor.syncToMarkdown()
  } else if (command === 'textColor') {
    document.execCommand('foreColor', false, value)
    wysiwygEditor.syncToMarkdown()
  } else if (command === 'bgColor') {
    document.execCommand('hiliteColor', false, value)
    wysiwygEditor.syncToMarkdown()
  } else if (command === 'insert') {
    // Handle insert commands
    if (value === 'link') {
      const url = prompt('请输入链接地址:', 'https://')
      if (url) {
        document.execCommand('createLink', false, url)
        wysiwygEditor.syncToMarkdown()
      }
    } else if (value === 'image') {
      const url = prompt('请输入图片地址:', 'https://')
      if (url) {
        document.execCommand('insertImage', false, url)
        wysiwygEditor.syncToMarkdown()
      }
    } else if (value === 'hr') {
      document.execCommand('insertHorizontalRule', false)
      wysiwygEditor.syncToMarkdown()
    } else if (value === 'quote') {
      document.execCommand('formatBlock', false, 'blockquote')
      wysiwygEditor.syncToMarkdown()
    }
  }
}

// Global keyboard shortcuts
function handleGlobalKeydown(event: KeyboardEvent) {
  const ctrl = event.ctrlKey || event.metaKey

  // Ctrl+/ : Toggle mode
  if (ctrl && event.key === '/') {
    event.preventDefault()
    const modes: EditorMode[] = ['source', 'split', 'preview', 'wysiwyg']
    const currentIndex = modes.indexOf(editorStore.mode)
    const nextIndex = (currentIndex + 1) % modes.length
    setMode(modes[nextIndex])
  }

  // Ctrl+S : Save
  if (ctrl && event.key === 's') {
    event.preventDefault()
    saveDocument()
  }

  // Ctrl+\ : Toggle sidebar (changed from Ctrl+B to avoid conflict with bold)
  if (ctrl && event.key === '\\') {
    event.preventDefault()
    toggleSidebar()
  }
}

// Save current document
async function saveDocument() {
  const doc = documentStore.currentDocument
  if (doc) {
    editorStore.startSaving()
    await documentStore.updateDocument(doc.id, { content: editorStore.content })
    editorStore.markSaved()
  }
}

// Auto-save with configurable delay
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
watch(() => editorStore.content, () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    if (editorStore.isDirty && documentStore.currentDocument) {
      saveDocument()
    }
  }, AUTO_SAVE_DELAY)
})

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})
</script>

<template>
  <div id="app-container">
    <header class="app-header">
      <div class="header-left">
        <button class="sidebar-toggle" title="切换侧边栏 (Ctrl+\)" @click="toggleSidebar">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
        <div class="logo">SimpleTextEditor</div>
      </div>
      <div class="header-center">
        <div class="mode-switcher">
          <button
            v-for="mode in (['source', 'preview', 'split', 'wysiwyg'] as EditorMode[])"
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
        <button class="save-btn" title="保存 (Ctrl+S)" @click="saveDocument">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
          </svg>
        </button>
        <span class="save-status" :class="{ saving: editorStore.isSaving, dirty: editorStore.isDirty }">
          {{ editorStore.isSaving ? '保存中...' : editorStore.isDirty ? '未保存' : '已保存' }}
        </span>
        <div class="collab-indicator" :class="{ connected: collaboration.connected.value }">
          <span class="collab-dot"></span>
          <span>{{ collaboration.users.value.length + 1 }} 人在线</span>
        </div>
      </div>
    </header>

    <Toolbar @command="handleCommand" />

    <div class="app-body">
      <!-- Sidebar -->
      <aside v-if="showSidebar" class="sidebar">
        <div class="sidebar-tabs">
          <button
            class="sidebar-tab"
            :class="{ active: sidebarTab === 'files' }"
            title="文件"
            @click="sidebarTab = 'files'"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
            </svg>
          </button>
          <button
            class="sidebar-tab"
            :class="{ active: sidebarTab === 'outline' }"
            title="大纲"
            @click="sidebarTab = 'outline'"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
          </button>
          <button
            class="sidebar-tab"
            :class="{ active: sidebarTab === 'collab' }"
            title="协作"
            @click="sidebarTab = 'collab'"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </button>
        </div>
        <div class="sidebar-content">
          <FileTree v-if="sidebarTab === 'files'" />
          <Outline v-else-if="sidebarTab === 'outline'" />
          <UserList
            v-else-if="sidebarTab === 'collab'"
            :users="collaboration.users.value"
            :current-user="collaboration.currentUser.value"
            :connected="collaboration.connected.value"
          />
        </div>
      </aside>

      <main class="app-main">
        <Editor ref="editorRef" />
      </main>
    </div>

    <footer class="app-footer">
      <div class="status-bar">
        <span class="status-item doc-title">
          {{ documentStore.currentDocument?.title || '未选择文档' }}
        </span>
        <span class="status-divider">|</span>
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
  gap: 12px;
}

.header-right {
  justify-content: flex-end;
}

.header-center {
  display: flex;
  justify-content: center;
}

.sidebar-toggle {
  padding: 6px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
}

.sidebar-toggle:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
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
  padding: 6px 12px;
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

.save-btn {
  padding: 6px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
}

.save-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
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

.collab-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
}

.collab-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-error);
}

.collab-indicator.connected .collab-dot {
  background: var(--accent-secondary);
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  display: flex;
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
}

.sidebar-tabs {
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 4px;
  border-right: 1px solid var(--border-color);
}

.sidebar-tab {
  padding: 8px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
}

.sidebar-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-tab.active {
  background: var(--bg-active);
  color: var(--accent-primary);
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
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

.status-item.doc-title {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-divider {
  margin: 0 8px;
  color: var(--border-color);
}
</style>
