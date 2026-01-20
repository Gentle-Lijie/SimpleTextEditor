<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useDocumentStore } from '@/stores/document'

const editorStore = useEditorStore()
const documentStore = useDocumentStore()

const emit = defineEmits<{
  close: []
}>()

const showDropdown = ref(false)
const isExporting = ref(false)const isImporting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Export formats
const exportFormats = [
  { id: 'markdown', label: 'Markdown (.md)', icon: 'M' },
  { id: 'html', label: 'HTML', icon: 'H' },
  { id: 'pdf', label: 'PDF', icon: 'P' },
  { id: 'docx', label: 'Word (.docx)', icon: 'W' },
  { id: 'odt', label: 'OpenDocument (.odt)', icon: 'O' },
  { id: 'latex', label: 'LaTeX (.tex)', icon: 'L' },
  { id: 'epub', label: 'EPUB', icon: 'E' }
]

// Import formats
const importFormats = '.md,.txt,.docx,.odt,.html,.htm,.rst,.tex,.latex,.epub'

// Toggle dropdown
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

// Close dropdown
function closeDropdown() {
  showDropdown.value = false
  emit('close')
}

// Export document
async function exportDocument(format: string) {
  const content = editorStore.content
  if (!content) {
    alert('没有内容可导出')
    return
  }

  const docTitle = documentStore.currentDocument?.title || 'document'

  // For markdown, just download directly
  if (format === 'markdown') {
    const blob = new Blob([content], { type: 'text/markdown' })
    downloadBlob(blob, `${docTitle}.md`)
    closeDropdown()
    return
  }

  isExporting.value = true

  try {
    const response = await fetch(`${API_URL}/api/convert/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        format,
        filename: `${docTitle}.${format}`
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Export failed')
    }

    const blob = await response.blob()
    downloadBlob(blob, `${docTitle}.${format}`)
  } catch (error) {
    console.error('Export error:', error)
    alert('导出失败: ' + (error instanceof Error ? error.message : '未知错误'))
  } finally {
    isExporting.value = false
    closeDropdown()
  }
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

// Trigger file input for import
function triggerImport() {
  fileInputRef.value?.click()
}

// Handle file import
async function handleFileImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const ext = file.name.split('.').pop()?.toLowerCase()

  // For markdown/text files, read directly
  if (ext === 'md' || ext === 'txt') {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      editorStore.setContent(content)
    }
    reader.readAsText(file)
    input.value = ''
    closeDropdown()
    return
  }

  // For other formats, use pandoc
  isImporting.value = true

  try {
    // Read file as base64
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
      editorStore.setContent(result.data.markdown)
    } else {
      throw new Error('Invalid response')
    }
  } catch (error) {
    console.error('Import error:', error)
    alert('导入失败: ' + (error instanceof Error ? error.message : '未知错误'))
  } finally {
    isImporting.value = false
    input.value = ''
    closeDropdown()
  }
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
  <div class="export-menu">
    <button
      class="export-btn"
      title="导入/导出"
      @click="toggleDropdown"
      :disabled="isExporting || isImporting"
    >
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      <span v-if="isExporting || isImporting" class="loading-text">
        {{ isExporting ? '导出中...' : '导入中...' }}
      </span>
    </button>

    <div v-if="showDropdown" class="dropdown">
      <div class="dropdown-section">
        <div class="section-title">导出</div>
        <button
          v-for="format in exportFormats"
          :key="format.id"
          class="dropdown-item"
          @click="exportDocument(format.id)"
          :disabled="isExporting"
        >
          <span class="format-icon">{{ format.icon }}</span>
          <span>{{ format.label }}</span>
        </button>
      </div>

      <div class="dropdown-divider"></div>

      <div class="dropdown-section">
        <div class="section-title">导入</div>
        <button
          class="dropdown-item"
          @click="triggerImport"
          :disabled="isImporting"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
          </svg>
          <span>选择文件...</span>
        </button>
        <div class="format-hint">
          支持: .md, .txt, .docx, .odt, .html, .rst, .tex, .epub
        </div>
      </div>
    </div>

    <!-- Hidden file input -->
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
.export-menu {
  position: relative;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.export-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-text {
  font-size: 12px;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 200px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 100;
}

.dropdown-section {
  padding: 4px;
}

.section-title {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  font-size: 13px;
  color: var(--text-primary);
  border-radius: var(--radius-sm);
}

.dropdown-item:hover:not(:disabled) {
  background: var(--bg-hover);
}

.dropdown-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.format-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}

.format-hint {
  padding: 4px 12px 8px;
  font-size: 11px;
  color: var(--text-tertiary);
}
</style>
