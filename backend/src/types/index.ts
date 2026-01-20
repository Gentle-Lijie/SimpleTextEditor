// Document types
export interface Document {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Create/Update document request
export interface CreateDocumentRequest {
  title?: string
  content?: string
}

export interface UpdateDocumentRequest {
  title?: string
  content?: string
}

// GitHub upload types
export interface GitHubUploadResult {
  success: boolean
  url?: string
  error?: string
}

// WebSocket event types
export interface JoinRoomEvent {
  documentId: string
  userId: string
  userName: string
  userColor: string
}

export interface LeaveRoomEvent {
  documentId: string
  userId: string
}

// Environment configuration
export interface EnvConfig {
  nodeEnv: string
  port: number
  databasePath: string
  githubToken: string
  githubOwner: string
  githubRepo: string
  githubBranch: string
}
