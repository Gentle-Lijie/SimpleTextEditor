<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, provide } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useDocumentStore } from '@/stores/document'
import Editor from '@/components/Editor/Editor.vue'
import Toolbar from '@/components/Toolbar/Toolbar.vue'
import WindowTakeoverOverlay from '@/components/Collaboration/WindowTakeoverOverlay.vue'
import AuthGate from '@/components/Auth/AuthGate.vue'
import AppHeader from '@/components/Layout/AppHeader.vue'
import AppSidebar from '@/components/Layout/AppSidebar.vue'
import StatusBar from '@/components/Layout/StatusBar.vue'
import type { EditorMode } from '@/types'
import {
  markdownWrappers,
  getHeadingPrefix,
  getListPrefix,
  getInsertTemplate,
  getColorWrapper
} from '@/utils/shortcuts'
import { useCollaboration } from '@/composables/useCollaboration'
import { useWindowManager } from '@/composables/useWindowManager'

const editorStore = useEditorStore()
const documentStore = useDocumentStore()
const editorRef = ref<InstanceType<typeof Editor> | null>(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const AUTO_SAVE_DELAY = parseInt(import.meta.env.VITE_AUTO_SAVE_DELAY || '3000')

const isAuthenticated = ref(false)
const showSidebar = ref(true)
const sidebarTab = ref<'files' | 'outline' | 'collab'>('files')

const windowManager = useWindowManager()

const currentDocId = computed(() => documentStore.currentDocument?.id || 'default')
const collaboration = useCollaboration(currentDocId)
provide('collaboration', collaboration)

const collabUserCount = computed(() => collaboration.users.value.length + 1)

watch(() => windowManager.isActive.value, (isActive: boolean) => {
  if (!isAuthenticated.value) return
  if (!isActive) {
    collaboration.disconnect()
  } else {
    collaboration.connect()
  }
})

watch(isAuthenticated, (authed: boolean) => {
  if (authed) {
    if (windowManager.isActive.value) {
      collaboration.connect()
    }
    window.addEventListener('keydown', handleGlobalKeydown)
  } else {
    collaboration.disconnect()
    window.removeEventListener('keydown', handleGlobalKeydown)
  }
})

function handleAuthenticated() {
  isAuthenticated.value = true
}

function setMode(mode: EditorMode) {
  editorStore.setMode(mode)
}

const modeLabels: Record<EditorMode, string> = {
  source: '源码',
  preview: '预览',
  split: '分屏',
  wysiwyg: '所见即所得'
}

function toggleSidebar() {
  showSidebar.value = !showSidebar.value
}

function handleChangeTab(tab: 'files' | 'outline' | 'collab') {
  sidebarTab.value = tab
}

function handleCommand(command: string, value?: string) {
  if (editorStore.mode === 'wysiwyg') {
    handleWYSIWYGCommand(command, value)
    return
  }

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

  editorStore.setContent(newContent)

  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(newCursorPos, newCursorPos)
  })
}

function handleWYSIWYGCommand(command: string, value?: string) {
  const wysiwygEditor = editorRef.value?.getWYSIWYGEditor()
  if (!wysiwygEditor) return

  const execCommandMap: Record<string, () => void> = {
    bold: () => document.execCommand('bold', false),
    italic: () => document.execCommand('italic', false),
    underline: () => document.execCommand('underline', false),
    strikethrough: () => document.execCommand('strikeThrough', false),
    code: () => {
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

function handleGlobalKeydown(event: KeyboardEvent) {
  const ctrl = event.ctrlKey || event.metaKey

  if (ctrl && event.key === '/') {
    event.preventDefault()
    const modes: EditorMode[] = ['source', 'split', 'preview', 'wysiwyg']
    const currentIndex = modes.indexOf(editorStore.mode)
    const nextIndex = (currentIndex + 1) % modes.length
    setMode(modes[nextIndex])
  }

  if (ctrl && event.key === 's') {
    event.preventDefault()
    saveDocument()
  }

  if (ctrl && event.key === '\\') {
    event.preventDefault()
    toggleSidebar()
  }
}

async function saveDocument() {
  const doc = documentStore.currentDocument
  if (doc && !documentStore.isDefaultDocument) {
    editorStore.startSaving()
    await documentStore.updateDocument(doc.id, { content: editorStore.content })
    editorStore.markSaved()
  }
}

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
watch(() => editorStore.content, () => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    if (editorStore.isDirty && documentStore.currentDocument && !documentStore.isDefaultDocument) {
      saveDocument()
    }
  }, AUTO_SAVE_DELAY)
})

onMounted(() => {
  collaboration.disconnect()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})
</script>

<template>
  <div id="app-wrapper">
    <AuthGate v-if="!isAuthenticated" :api-url="API_URL" @authenticated="handleAuthenticated" />

    <div v-else id="app-container">
      <AppHeader
        :editor-mode="editorStore.mode"
        :mode-labels="modeLabels"
        :is-saving="editorStore.isSaving"
        :is-dirty="editorStore.isDirty"
        :is-readonly="documentStore.isDefaultDocument"
        :collab-user-count="collabUserCount"
        :collab-connected="collaboration.connected.value"
        @toggle-sidebar="toggleSidebar"
        @change-mode="setMode"
        @save="saveDocument"
      />

      <Toolbar @command="handleCommand" />

      <div class="app-body">
        <AppSidebar
          v-if="showSidebar"
          :active-tab="sidebarTab"
          :users="collaboration.users.value"
          :current-user="collaboration.currentUser.value"
          :connected="collaboration.connected.value"
          @change-tab="handleChangeTab"
          @update:user-name="collaboration.setUserName"
        />

        <main class="app-main">
          <Editor ref="editorRef" />
        </main>
      </div>

      <StatusBar
        :title="documentStore.currentDocument?.title || '未选择文档'"
        :line="editorStore.cursorLine"
        :column="editorStore.cursorColumn"
        :char-count="editorStore.charCount"
        :word-count="editorStore.wordCount"
        :reading-time="editorStore.readingTime"
      />

      <WindowTakeoverOverlay
        :show="!windowManager.isActive.value"
        @reclaim="windowManager.reclaim"
      />
    </div>
  </div>
</template>

<style scoped>
#app-wrapper {
  min-height: 100vh;
}

#app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
