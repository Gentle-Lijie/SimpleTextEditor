<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'upload', url: string): void
  (e: 'close'): void
}>()

const isUploading = ref(false)
const uploadError = ref('')
const imageUrl = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  await uploadFile(file)
}

async function uploadFile(file: File) {
  if (!file.type.startsWith('image/')) {
    uploadError.value = '请选择图片文件'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = '图片大小不能超过 5MB'
    return
  }

  isUploading.value = true
  uploadError.value = ''

  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (result.success && result.data?.url) {
      imageUrl.value = result.data.url
      emit('upload', result.data.url)
    } else {
      uploadError.value = result.error || '上传失败'
    }
  } catch (error) {
    uploadError.value = '网络错误，请重试'
    console.error('Upload error:', error)
  } finally {
    isUploading.value = false
  }
}

function insertUrl() {
  if (imageUrl.value) {
    emit('upload', imageUrl.value)
  }
}

// Handle paste
function handlePaste(event: ClipboardEvent) {
  const items = event.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        uploadFile(file)
      }
    }
  }
}

// Handle drag and drop
function handleDrop(event: DragEvent) {
  event.preventDefault()
  const files = event.dataTransfer?.files
  if (files?.[0]) {
    uploadFile(files[0])
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
}
</script>

<template>
  <div
    class="image-upload"
    @paste="handlePaste"
    @drop="handleDrop"
    @dragover="handleDragOver"
  >
    <div class="upload-area" @click="triggerFileInput">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        hidden
        @change="handleFileSelect"
      />
      <div v-if="isUploading" class="uploading">
        <span class="spinner"></span>
        <span>上传中...</span>
      </div>
      <div v-else class="upload-prompt">
        <span class="upload-icon">📁</span>
        <p>点击选择图片</p>
        <p class="upload-hint">或拖拽/粘贴图片到此处</p>
      </div>
    </div>

    <div v-if="uploadError" class="error-message">
      {{ uploadError }}
    </div>

    <div class="url-input-section">
      <label>或输入图片 URL:</label>
      <div class="url-input-row">
        <input
          v-model="imageUrl"
          type="url"
          placeholder="https://example.com/image.png"
          class="url-input"
        />
        <button
          class="insert-btn"
          :disabled="!imageUrl"
          @click="insertUrl"
        >
          插入
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-upload {
  padding: 16px;
  min-width: 300px;
}

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.upload-area:hover {
  border-color: var(--accent-primary);
  background: var(--bg-hover);
}

.upload-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.upload-prompt p {
  margin: 4px 0;
  color: var(--text-secondary);
}

.upload-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.uploading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--accent-primary);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(234, 67, 53, 0.1);
  color: var(--accent-error);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.url-input-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.url-input-section label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}

.url-input-row {
  display: flex;
  gap: 8px;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
}

.insert-btn {
  padding: 8px 16px;
  background: var(--accent-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.insert-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.insert-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
