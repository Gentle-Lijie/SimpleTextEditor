import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database/index.js'
import type { Document } from '../types/index.js'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

interface DocumentRow extends RowDataPacket {
  id: string
  title: string
  content: string
  created_at: Date
  updated_at: Date
}

interface YjsRow extends RowDataPacket {
  state: Buffer
}

function formatDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString()
  }
}

// Get all documents
export async function getAllDocuments(): Promise<Document[]> {
  const db = getDatabase()
  const [rows] = await db.execute<DocumentRow[]>(
    'SELECT * FROM documents ORDER BY updated_at DESC'
  )
  return rows.map(formatDocument)
}

// Get document by ID
export async function getDocumentById(id: string): Promise<Document | undefined> {
  const db = getDatabase()
  const [rows] = await db.execute<DocumentRow[]>(
    'SELECT * FROM documents WHERE id = ?',
    [id]
  )
  return rows[0] ? formatDocument(rows[0]) : undefined
}

// Create new document
export async function createDocument(title?: string, content?: string): Promise<Document> {
  const db = getDatabase()
  const id = uuidv4()

  await db.execute(
    'INSERT INTO documents (id, title, content) VALUES (?, ?, ?)',
    [id, title || 'Untitled', content || '']
  )

  const doc = await getDocumentById(id)
  return doc!
}

// Update document
export async function updateDocument(id: string, title?: string, content?: string): Promise<Document | undefined> {
  const db = getDatabase()
  const existing = await getDocumentById(id)

  if (!existing) {
    return undefined
  }

  const newTitle = title !== undefined ? title : existing.title
  const newContent = content !== undefined ? content : existing.content

  await db.execute(
    'UPDATE documents SET title = ?, content = ? WHERE id = ?',
    [newTitle, newContent, id]
  )

  return await getDocumentById(id)
}

// Delete document
export async function deleteDocument(id: string): Promise<boolean> {
  const db = getDatabase()
  const [result] = await db.execute<ResultSetHeader>(
    'DELETE FROM documents WHERE id = ?',
    [id]
  )
  return result.affectedRows > 0
}

// Save Yjs document state
export async function saveYjsState(docId: string, state: Buffer): Promise<void> {
  const db = getDatabase()

  await db.execute(
    `INSERT INTO yjs_documents (doc_id, state)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE state = VALUES(state)`,
    [docId, state]
  )
}

// Get Yjs document state
export async function getYjsState(docId: string): Promise<Buffer | undefined> {
  const db = getDatabase()
  const [rows] = await db.execute<YjsRow[]>(
    'SELECT state FROM yjs_documents WHERE doc_id = ?',
    [docId]
  )
  return rows[0]?.state
}
