import { Router, Request, Response } from 'express'
import * as documentService from '../services/documentService.js'

const router = Router()

// Get all documents
router.get('/', (_req: Request, res: Response) => {
  try {
    const documents = documentService.getAllDocuments()
    res.json({ success: true, data: documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch documents' })
  }
})

// Get single document by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const document = documentService.getDocumentById(req.params.id)
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' })
    }
    res.json({ success: true, data: document })
  } catch (error) {
    console.error('Error fetching document:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch document' })
  }
})

// Create new document
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, content } = req.body
    const document = documentService.createDocument(title, content)
    res.status(201).json({ success: true, data: document })
  } catch (error) {
    console.error('Error creating document:', error)
    res.status(500).json({ success: false, error: 'Failed to create document' })
  }
})

// Update document
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { title, content } = req.body
    const document = documentService.updateDocument(req.params.id, title, content)
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' })
    }
    res.json({ success: true, data: document })
  } catch (error) {
    console.error('Error updating document:', error)
    res.status(500).json({ success: false, error: 'Failed to update document' })
  }
})

// Delete document
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = documentService.deleteDocument(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Document not found' })
    }
    res.json({ success: true, data: { id: req.params.id } })
  } catch (error) {
    console.error('Error deleting document:', error)
    res.status(500).json({ success: false, error: 'Failed to delete document' })
  }
})

export default router
