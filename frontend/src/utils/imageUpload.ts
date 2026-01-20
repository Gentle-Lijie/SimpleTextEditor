const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload an image file to GitHub image hosting
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('image', file)

  try {
    const response = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (result.success) {
      return { success: true, url: result.data.url }
    } else {
      return { success: false, error: result.error || 'Upload failed' }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Upload an image from clipboard data
 */
export async function uploadImageFromClipboard(clipboardData: DataTransfer): Promise<UploadResult | null> {
  // Check for image files in clipboard
  const items = clipboardData.items
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        return uploadImage(file)
      }
    }
  }
  return null
}

/**
 * Upload an image from a Blob
 */
export async function uploadImageFromBlob(blob: Blob, filename: string = 'image.png'): Promise<UploadResult> {
  const file = new File([blob], filename, { type: blob.type })
  return uploadImage(file)
}

/**
 * Generate markdown image syntax
 */
export function generateImageMarkdown(url: string, alt: string = 'image'): string {
  return `![${alt}](${url})`
}

/**
 * Check if clipboard contains an image
 */
export function hasImageInClipboard(clipboardData: DataTransfer): boolean {
  const items = clipboardData.items
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      return true
    }
  }
  return false
}
