<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'
import { useDocumentStore } from '@/stores/document'
import { exportMarkdown, exportHTML, exportPDF, importMarkdown } from '@/utils/export'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'close'): void
}>()

const editorStore = useEditorStore()
const documentStore = useDocumentStore()

function getTitle(): string {
  return documentStore.currentDocument?.title || 'document'
}

function handleExportMarkdown() {
  exportMarkdown(editorStore.content, getTitle())
  emit('close')
}

function handleExportHTML() {
  exportHTML(editorStore.content, getTitle())
  emit('close')
}

function handleExportPDF() {
  exportPDF(editorStore.content, getTitle())
  emit('close')
}

async function handleImport() {
  const result = await importMarkdown()
  if (result) {
    editorStore.setContent(result.content)
  }
  emit('close')
}
</script>

<template>
  <div class="toolbar-dropdown">
    <button class="toolbar-btn dropdown-trigger" title="导入/导出" @click="emit('toggle')">
      📥
      <span class="dropdown-arrow">▾</span>
    </button>
    <div v-if="isOpen" class="dropdown-menu">
      <div class="menu-section">
        <div class="section-title">导出</div>
        <button class="dropdown-item" @click="handleExportMarkdown">
          <span class="item-icon">📄</span>
          <span>Markdown (.md)</span>
        </button>
        <button class="dropdown-item" @click="handleExportHTML">
          <span class="item-icon">🌐</span>
          <span>HTML (.html)</span>
        </button>
        <button class="dropdown-item" @click="handleExportPDF">
          <span class="item-icon">📑</span>
          <span>PDF (打印)</span>
        </button>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-section">
        <div class="section-title">导入</div>
        <button class="dropdown-item" @click="handleImport">
          <span class="item-icon">📂</span>
          <span>打开 Markdown 文件</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-dropdown {
  position: relative;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  font-size: 14px;
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.toolbar-btn:hover {
  background: var(--toolbar-button-hover);
}

.dropdown-trigger {
  gap: 4px;
}

.dropdown-arrow {
  font-size: 10px;
  color: var(--text-secondary);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 200px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 100;
  overflow: hidden;
}

.menu-section {
  padding: 8px 0;
}

.section-title {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  font-size: 13px;
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.item-icon {
  width: 20px;
  text-align: center;
}
</style>
