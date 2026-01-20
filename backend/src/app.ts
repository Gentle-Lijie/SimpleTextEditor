import express from 'express'
import cors from 'cors'
import documentsRouter from './routes/documents.js'
import uploadRouter from './routes/upload.js'
import exportRouter from './routes/export.js'

const app = express()

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false // Same origin in production
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/documents', documentsRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/convert', exportRouter)

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message)
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  })
})

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  })
})

export default app
