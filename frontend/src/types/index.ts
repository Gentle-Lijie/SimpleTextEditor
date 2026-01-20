// Document types
export interface Document {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Editor types
export type EditorMode = 'source' | 'preview' | 'split' | 'wysiwyg'

export interface EditorState {
  mode: EditorMode
  content: string
  cursorPosition: CursorPosition
  selection: Selection | null
  isDirty: boolean
  isSaving: boolean
}

export interface CursorPosition {
  line: number
  column: number
}

export interface Selection {
  start: CursorPosition
  end: CursorPosition
}

// Collaboration types
export interface CollaborationUser {
  id: string
  name: string
  color: string
  cursor?: CursorPosition
  selection?: Selection
}

export interface CollaborationState {
  connected: boolean
  users: CollaborationUser[]
  documentId: string | null
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Toolbar types
export interface ToolbarItem {
  id: string
  icon: string
  label: string
  shortcut?: string
  action: () => void
  isActive?: () => boolean
  isDisabled?: () => boolean
}

export interface DropdownItem {
  id: string
  label: string
  action: () => void
  shortcut?: string
}

// File tree types
export interface FileTreeItem {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: FileTreeItem[]
  isExpanded?: boolean
}

// Export types
export type ExportFormat = 'markdown' | 'html' | 'pdf'

// Upload types
export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

// Environment configuration
export interface EnvConfig {
  apiUrl: string
  wsUrl: string
  githubOwner: string
  githubRepo: string
  githubBranch: string
}
