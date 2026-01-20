<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDocumentStore } from '@/stores/document'
import { useEditorStore } from '@/stores/editor'

const documentStore = useDocumentStore()
const editorStore = useEditorStore()

const isCreating = ref(false)
const newDocTitle = ref('')
const renamingId = ref<string | null>(null)
const renameTitle = ref('')

onMounted(() => {
  documentStore.fetchDocuments()
})

async function createNewDocument() {
  if (!newDocTitle.value.trim()) {
    newDocTitle.value = 'Untitled'
  }

  const doc = await documentStore.createDocument(newDocTitle.value)
  if (doc) {
    editorStore.setContent(doc.content)
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
    editorStore.setContent(fullDoc.content)
    editorStore.markSaved()
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
</script>

<template>
  <div class="file-tree">
    <div class="file-tree-header">
      <span>文档</span>
      <button class="new-doc-btn" title="新建文档" @click="isCreating = true">+</button>
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
        <button @click="createNewDocument">✓</button>
        <button @click="cancelCreate">✕</button>
      </div>
    </div>

    <div v-if="documentStore.isLoading" class="loading">
      加载中...
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
          <div class="file-icon">📄</div>
          <div class="file-info">
            <div class="file-name">{{ doc.title }}</div>
            <div class="file-date">{{ formatDate(doc.updatedAt) }}</div>
          </div>
          <div class="file-actions" @click.stop>
            <button title="重命名" @click="startRename(doc)">✏️</button>
            <button title="删除" @click="deleteDoc(doc.id)">🗑️</button>
          </div>
        </template>
      </div>

      <div v-if="documentStore.documents.length === 0" class="empty">
        暂无文档，点击 + 创建新文档
      </div>
    </div>
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

.new-doc-btn {
  width: 24px;
  height: 24px;
  font-size: 18px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
}

.new-doc-btn:hover {
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
  padding: 4px 8px;
  font-size: 12px;
  border-radius: var(--radius-sm);
}

.input-actions button:hover {
  background: var(--bg-hover);
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
  font-size: 16px;
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
  gap: 4px;
}

.file-item:hover .file-actions {
  display: flex;
}

.file-actions button {
  padding: 2px 4px;
  font-size: 12px;
  opacity: 0.6;
}

.file-actions button:hover {
  opacity: 1;
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
</style>
