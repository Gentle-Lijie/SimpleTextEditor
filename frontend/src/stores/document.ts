import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Document } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const useDocumentStore = defineStore('document', () => {
  // State
  const documents = ref<Document[]>([])
  const currentDocument = ref<Document | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const autoSaveTimer = ref<number | null>(null)

  // Computed
  const sortedDocuments = computed(() => {
    return [...documents.value].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  })

  // Actions
  async function fetchDocuments() {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_URL}/api/documents`)
      const result = await response.json()

      if (result.success) {
        documents.value = result.data
      } else {
        error.value = result.error || 'Failed to fetch documents'
      }
    } catch (e) {
      error.value = 'Network error'
      console.error('Fetch documents error:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDocument(id: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_URL}/api/documents/${id}`)
      const result = await response.json()

      if (result.success) {
        currentDocument.value = result.data
        return result.data
      } else {
        error.value = result.error || 'Document not found'
        return null
      }
    } catch (e) {
      error.value = 'Network error'
      console.error('Fetch document error:', e)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createDocument(title?: string, content?: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'Untitled', content: content || '' })
      })
      const result = await response.json()

      if (result.success) {
        documents.value.unshift(result.data)
        currentDocument.value = result.data
        return result.data
      } else {
        error.value = result.error || 'Failed to create document'
        return null
      }
    } catch (e) {
      error.value = 'Network error'
      console.error('Create document error:', e)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function updateDocument(id: string, updates: { title?: string; content?: string }) {
    try {
      const response = await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const result = await response.json()

      if (result.success) {
        // Update in list
        const index = documents.value.findIndex(d => d.id === id)
        if (index !== -1) {
          documents.value[index] = result.data
        }
        // Update current if same
        if (currentDocument.value?.id === id) {
          currentDocument.value = result.data
        }
        return result.data
      } else {
        console.error('Update failed:', result.error)
        return null
      }
    } catch (e) {
      console.error('Update document error:', e)
      return null
    }
  }

  async function deleteDocument(id: string) {
    try {
      const response = await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.success) {
        documents.value = documents.value.filter(d => d.id !== id)
        if (currentDocument.value?.id === id) {
          currentDocument.value = null
        }
        return true
      } else {
        console.error('Delete failed:', result.error)
        return false
      }
    } catch (e) {
      console.error('Delete document error:', e)
      return false
    }
  }

  function setCurrentDocument(doc: Document | null) {
    currentDocument.value = doc
  }

  // Auto-save functionality
  function startAutoSave(id: string, getContent: () => string, interval = 30000) {
    stopAutoSave()

    autoSaveTimer.value = window.setInterval(async () => {
      const content = getContent()
      if (currentDocument.value && content !== currentDocument.value.content) {
        await updateDocument(id, { content })
      }
    }, interval)
  }

  function stopAutoSave() {
    if (autoSaveTimer.value) {
      clearInterval(autoSaveTimer.value)
      autoSaveTimer.value = null
    }
  }

  return {
    // State
    documents,
    currentDocument,
    isLoading,
    error,
    // Computed
    sortedDocuments,
    // Actions
    fetchDocuments,
    fetchDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    setCurrentDocument,
    startAutoSave,
    stopAutoSave
  }
})
