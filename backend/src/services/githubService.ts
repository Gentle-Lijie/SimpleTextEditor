import { v4 as uuidv4 } from 'uuid'

interface GitHubUploadResponse {
  content: {
    sha: string
    path: string
    html_url: string
    download_url: string
  }
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload an image to GitHub repository and return CDN URL
 */
export async function uploadImageToGitHub(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER || 'Gentle-Lijie'
  const repo = process.env.GITHUB_REPO || 'SimpleTextEditor'
  const branch = process.env.GITHUB_BRANCH || 'images'

  if (!token) {
    return { success: false, error: 'GitHub token not configured' }
  }

  try {
    // Generate unique filename
    const ext = getFileExtension(originalName, mimeType)
    const timestamp = Date.now()
    const uniqueId = uuidv4().slice(0, 8)
    const fileName = `${timestamp}-${uniqueId}${ext}`
    const path = `images/${fileName}`

    // Convert buffer to base64
    const content = buffer.toString('base64')

    // Upload to GitHub
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          message: `Upload image: ${fileName}`,
          content: content,
          branch: branch
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json() as { message?: string }
      console.error('GitHub API error:', errorData)
      return {
        success: false,
        error: `GitHub API error: ${response.status} - ${errorData.message || 'Unknown error'}`
      }
    }

    await response.json() as GitHubUploadResponse

    // Return jsdelivr CDN URL for faster delivery
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`

    return {
      success: true,
      url: cdnUrl
    }
  } catch (error) {
    console.error('Error uploading to GitHub:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    }
  }
}

/**
 * Get file extension from original name or mime type
 */
function getFileExtension(originalName: string, mimeType: string): string {
  // Try to get from original name first
  const match = originalName.match(/\.[a-zA-Z0-9]+$/)
  if (match) {
    return match[0].toLowerCase()
  }

  // Fallback to mime type
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
  }

  return mimeToExt[mimeType] || '.png'
}
