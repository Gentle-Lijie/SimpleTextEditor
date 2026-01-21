<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDocumentStore, DEFAULT_DOC_TITLE } from '@/stores/document'
import { useEditorStore } from '@/stores/editor'

const documentStore = useDocumentStore()
const editorStore = useEditorStore()

const isCreating = ref(false)
const newDocTitle = ref('')
const renamingId = ref<string | null>(null)
const renameTitle = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Default document content (read-only)
const DEFAULT_DOC_CONTENT = `# 欢迎使用 SimpleTextEditor

这是一个支持多人实时协作的 Markdown 编辑器。

## 功能特性

- **实时协作**: 多人同时编辑，实时同步
- **Markdown 支持**: 完整的 GFM 语法支持
- **数学公式**: 支持 LaTeX 数学公式
- **代码高亮**: 多种编程语言语法高亮
- **图表支持**: 支持 Mermaid 图表
- **主题切换**: 支持亮色/暗色主题

## 快速开始

1. 在左侧创建新文档
2. 选择编辑模式（源码/预览/分屏/所见即所得）
3. 开始编写 Markdown

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+S | 保存文档 |
| Ctrl+B | 粗体 |
| Ctrl+I | 斜体 |
| Ctrl+/ | 切换模式 |

祝您使用愉快！
`

// Update URL with document ID (without page reload)
function updateUrlWithDocId(docId: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('doc', docId)
  window.history.replaceState({}, '', url.toString())
}

// Get document ID from URL parameter
function getDocIdFromUrl(): string | null {
  const url = new URL(window.location.href)
  return url.searchParams.get('doc')
}

// Copy document link to clipboard
async function copyDocumentLink(doc: typeof documentStore.documents[0], event: Event) {
  event.stopPropagation()
  const url = new URL(window.location.href)
  url.searchParams.set('doc', doc.id)

  try {
    await navigator.clipboard.writeText(url.toString())
    // Show brief feedback (could be improved with a toast notification)
    alert('链接已复制到剪贴板')
  } catch (err) {
    console.error('Failed to copy link:', err)
    alert('复制失败')
  }
}

onMounted(async () => {
  await documentStore.fetchDocuments()

  // Check for document ID in URL parameter
  const urlDocId = getDocIdFromUrl()

  // If no documents exist, create default document
  if (documentStore.documents.length === 0) {
    const doc = await documentStore.createDocument(DEFAULT_DOC_TITLE, DEFAULT_DOC_CONTENT)
    if (doc) {
      editorStore.setContent(doc.content)
      updateUrlWithDocId(doc.id)
    }
  } else if (urlDocId) {
    // Try to open document from URL parameter
    const targetDoc = documentStore.documents.find(d => d.id === urlDocId)
    if (targetDoc) {
      const fullDoc = await documentStore.fetchDocument(targetDoc.id)
      if (fullDoc) {
        if (fullDoc.title === DEFAULT_DOC_TITLE) {
          editorStore.setContent(DEFAULT_DOC_CONTENT)
        } else {
          editorStore.setContent(fullDoc.content)
        }
        editorStore.markSaved()
      }
    } else {
      // Document not found, open most recent
      const mostRecent = documentStore.sortedDocuments[0]
      if (mostRecent) {
        const fullDoc = await documentStore.fetchDocument(mostRecent.id)
        if (fullDoc) {
          editorStore.setContent(fullDoc.content)
          editorStore.markSaved()
          updateUrlWithDocId(mostRecent.id)
        }
      }
    }
  } else if (!documentStore.currentDocument) {
    // Open the most recent document by default
    const mostRecent = documentStore.sortedDocuments[0]
    if (mostRecent) {
      const fullDoc = await documentStore.fetchDocument(mostRecent.id)
      if (fullDoc) {
        editorStore.setContent(fullDoc.content)
        editorStore.markSaved()
        updateUrlWithDocId(mostRecent.id)
      }
    }
  }
})

async function createNewDocument() {
  if (!newDocTitle.value.trim()) {
    newDocTitle.value = 'Untitled'
  }

  const doc = await documentStore.createDocument(newDocTitle.value)
  if (doc) {
    editorStore.setContent(doc.content)
    updateUrlWithDocId(doc.id)
    isCreating.value = false
    newDocTitle.value = ''
  }
}

function cancelCreate() {
  isCreating.value = false
  newDocTitle.value = ''
}

async function selectDocument(doc: typeof documentStore.documents[0]) {
  const fullDoc = await documentStore.fetchDocument(doc.id)
  if (fullDoc) {
    // If it's the default document, always show the default content (read-only)
    if (fullDoc.title === DEFAULT_DOC_TITLE) {
      editorStore.setContent(DEFAULT_DOC_CONTENT)
      // Reset the document content in database to default
      await documentStore.updateDocument(doc.id, { content: DEFAULT_DOC_CONTENT })
    } else {
      editorStore.setContent(fullDoc.content)
    }
    editorStore.markSaved()
    updateUrlWithDocId(doc.id)
  }
}

function startRename(doc: typeof documentStore.documents[0]) {
  renamingId.value = doc.id
  renameTitle.value = doc.title
}

async function confirmRename(id: string) {
  if (renameTitle.value.trim()) {
    await documentStore.updateDocument(id, { title: renameTitle.value })
  }
  renamingId.value = null
  renameTitle.value = ''
}

function cancelRename() {
  renamingId.value = null
  renameTitle.value = ''
}

async function deleteDoc(id: string) {
  if (confirm('确定要删除这个文档吗？')) {
    await documentStore.deleteDocument(id)
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  return date.toLocaleDateString('zh-CN')
}

// Import formats
const importFormats = '.md,.txt,.docx,.odt,.html,.htm,.rst,.tex,.latex,.epub'

// Trigger file input for import (creates new document)
function triggerImport() {
  fileInputRef.value?.click()
}

// Handle file import - creates a new document
async function handleFileImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const ext = file.name.split('.').pop()?.toLowerCase()
  // Get document title from filename (without extension)
  const docTitle = file.name.replace(/\.[^/.]+$/, '') || 'Imported Document'

  // For markdown/text files, read directly
  if (ext === 'md' || ext === 'txt') {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      // Create new document with imported content
      const doc = await documentStore.createDocument(docTitle, content)
      if (doc) {
        editorStore.setContent(doc.content)
      }
    }
    reader.readAsText(file)
    input.value = ''
    return
  }

  // For other formats, use pandoc
  isImporting.value = true

  try {
    const base64 = await fileToBase64(file)

    const response = await fetch(`${API_URL}/api/convert/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: base64,
        format: ext,
        filename: file.name
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Import failed')
    }

    const result = await response.json()
    if (result.success && result.data.markdown) {
      // Create new document with imported content
      const doc = await documentStore.createDocument(docTitle, result.data.markdown)
      if (doc) {
        editorStore.setContent(doc.content)
      }
    } else {
      throw new Error('Invalid response')
    }
  } catch (error) {
    console.error('Import error:', error)
    alert('导入失败: ' + (error instanceof Error ? error.message : '未知错误'))
  } finally {
    isImporting.value = false
    input.value = ''
  }
}

// Export document
async function exportDocument(doc: typeof documentStore.documents[0], event: Event) {
  event.stopPropagation()

  // Get full document content
  let content = editorStore.content
  if (documentStore.currentDocument?.id !== doc.id) {
    // Fetch the document content if it's not the current one
    const fullDoc = await documentStore.fetchDocument(doc.id)
    if (fullDoc) {
      content = fullDoc.content
    }
  }

  if (!content) {
    alert('没有内容可导出')
    return
  }

  // Export as markdown
  const blob = new Blob([content], { type: 'text/markdown' })
  downloadBlob(blob, `${doc.title}.md`)
}

// Download blob as file
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
</script>

<template>
  <div class="file-tree">
    <div class="file-tree-header">
      <span>文档</span>
      <div class="header-actions">
        <button class="header-btn" title="导入文件" @click="triggerImport">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
          </svg>
        </button>
        <button class="header-btn" title="新建文档" @click="isCreating = true">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="isCreating" class="new-doc-input">
      <input
        v-model="newDocTitle"
        placeholder="文档标题"
        autofocus
        @keyup.enter="createNewDocument"
        @keyup.esc="cancelCreate"
      />
      <div class="input-actions">
        <button @click="createNewDocument" title="确认">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </button>
        <button @click="cancelCreate" title="取消">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="documentStore.isLoading || isImporting" class="loading">
      {{ isImporting ? '导入中...' : '加载中...' }}
    </div>

    <div v-else-if="documentStore.error" class="error">
      {{ documentStore.error }}
    </div>

    <div v-else class="file-list">
      <div
        v-for="doc in documentStore.sortedDocuments"
        :key="doc.id"
        class="file-item"
        :class="{ active: documentStore.currentDocument?.id === doc.id }"
        @click="selectDocument(doc)"
      >
        <div v-if="renamingId === doc.id" class="rename-input" @click.stop>
          <input
            v-model="renameTitle"
            autofocus
            @keyup.enter="confirmRename(doc.id)"
            @keyup.esc="cancelRename"
            @blur="confirmRename(doc.id)"
          />
        </div>
        <template v-else>
          <div class="file-icon">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
          </div>
          <div class="file-info">
            <div class="file-name">{{ doc.title }}</div>
            <div class="file-date">{{ formatDate(doc.updatedAt) }}</div>
          </div>
          <div class="file-actions" @click.stop>
            <button title="复制链接" @click="copyDocumentLink(doc, $event)">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            </button>
            <button title="导出" @click="exportDocument(doc, $event)">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </button>
            <!-- Hide rename/delete for default document -->
            <template v-if="doc.title !== DEFAULT_DOC_TITLE">
              <button title="重命名" @click="startRename(doc)">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </button>
              <button title="删除" @click="deleteDoc(doc.id)">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </template>
          </div>
        </template>
      </div>

      <div v-if="documentStore.documents.length === 0" class="empty">
        暂无文档，点击 + 创建新文档
      </div>
    </div>

    <!-- Hidden file input for import -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="importFormats"
      style="display: none"
      @change="handleFileImport"
    />
  </div>
</template>

<style scoped>
.file-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.file-tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
}

.header-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.new-doc-input {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
}

.new-doc-input input {
  width: 100%;
  padding: 6px 8px;
  font-size: 13px;
  margin-bottom: 8px;
}

.input-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.input-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.input-actions button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.file-item:hover {
  background: var(--bg-hover);
}

.file-item.active {
  background: var(--bg-active);
}

.file-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.file-item.active .file-icon {
  color: var(--accent-primary);
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-date {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.file-actions {
  display: none;
  gap: 2px;
  flex-shrink: 0;
}

.file-item:hover .file-actions {
  display: flex;
}

.file-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}

.file-actions button:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.rename-input {
  flex: 1;
}

.rename-input input {
  width: 100%;
  padding: 4px 8px;
  font-size: 13px;
}

.loading,
.error,
.empty {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
}

.error {
  color: var(--accent-error);
}

/* Responsive Styles */
@media screen and (max-width: 768px) {
  .file-tree-header {
    padding: 14px 16px;
  }

  .header-btn {
    width: 36px;
    height: 36px;
  }

  .header-btn svg {
    width: 20px;
    height: 20px;
  }

  .new-doc-input {
    padding: 12px 16px;
  }

  .new-doc-input input {
    padding: 12px;
    font-size: 16px;
    margin-bottom: 12px;
  }

  .input-actions button {
    padding: 10px 16px;
    min-height: 44px;
  }

  .file-list {
    -webkit-overflow-scrolling: touch;
  }

  .file-item {
    padding: 12px 16px;
    min-height: 56px;
  }

  .file-icon svg {
    width: 20px;
    height: 20px;
  }

  .file-name {
    font-size: 15px;
  }

  .file-date {
    font-size: 12px;
    margin-top: 4px;
  }

  /* Always show actions on mobile (no hover) */
  .file-actions {
    display: flex;
    opacity: 0.7;
  }

  .file-item.active .file-actions,
  .file-item:active .file-actions {
    opacity: 1;
  }

  .file-actions button {
    padding: 8px;
    min-width: 36px;
    min-height: 36px;
  }

  .file-actions button svg {
    width: 18px;
    height: 18px;
  }

  .rename-input input {
    padding: 10px 12px;
    font-size: 16px;
  }

  .loading,
  .error,
  .empty {
    padding: 24px 16px;
    font-size: 14px;
  }
}

@media screen and (max-width: 480px) {
  .file-actions button {
    padding: 6px;
    min-width: 32px;
    min-height: 32px;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .file-item:hover {
    background: inherit;
  }

  .file-item:active {
    background: var(--bg-active);
  }

  .file-actions {
    display: flex;
  }
}
</style>
