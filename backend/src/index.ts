import 'dotenv/config'
import { createServer } from 'http'
import app from './app.js'
import { initDatabase } from './database/index.js'
import { setupWebSocket } from './websocket.js'

const PORT = process.env.PORT || 3001

async function main() {
  try {
    // Initialize database
    console.log('Initializing database...')
    await initDatabase()
    console.log('Database initialized successfully')

    // Create HTTP server
    const httpServer = createServer(app)

    // Setup WebSocket
    setupWebSocket(httpServer)
    console.log('WebSocket server initialized')

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

main()
