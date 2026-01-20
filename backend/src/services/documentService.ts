import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database/index.js'
import type { Document } from '../types/index.js'

// Get all documents
export function getAllDocuments(): Document[] {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM documents ORDER BY updated_at DESC')
  return stmt.all() as Document[]
}

// Get document by ID
export function getDocumentById(id: string): Document | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM documents WHERE id = ?')
  return stmt.get(id) as Document | undefined
}

// Create new document
export function createDocument(title?: string, content?: string): Document {
  const db = getDatabase()
  const id = uuidv4()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO documents (id, title, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  stmt.run(id, title || 'Untitled', content || '', now, now)

  return {
    id,
    title: title || 'Untitled',
    content: content || '',
    created_at: now,
    updated_at: now
  }
}

// Update document
export function updateDocument(id: string, title?: string, content?: string): Document | undefined {
  const db = getDatabase()
  const existing = getDocumentById(id)

  if (!existing) {
    return undefined
  }

  const now = new Date().toISOString()
  const newTitle = title !== undefined ? title : existing.title
  const newContent = content !== undefined ? content : existing.content

  const stmt = db.prepare(`
    UPDATE documents
    SET title = ?, content = ?, updated_at = ?
    WHERE id = ?
  `)

  stmt.run(newTitle, newContent, now, id)

  return {
    ...existing,
    title: newTitle,
    content: newContent,
    updated_at: now
  }
}

// Delete document
export function deleteDocument(id: string): boolean {
  const db = getDatabase()
  const stmt = db.prepare('DELETE FROM documents WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

// Save Yjs document state
export function saveYjsState(docId: string, state: Buffer): void {
  const db = getDatabase()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO yjs_documents (doc_id, state, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(doc_id) DO UPDATE SET
      state = excluded.state,
      updated_at = excluded.updated_at
  `)

  stmt.run(docId, state, now)
}

// Get Yjs document state
export function getYjsState(docId: string): Buffer | undefined {
  const db = getDatabase()
  const stmt = db.prepare('SELECT state FROM yjs_documents WHERE doc_id = ?')
  const result = stmt.get(docId) as { state: Buffer } | undefined
  return result?.state
}
