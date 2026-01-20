import { Server as HttpServer, IncomingMessage } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
// @ts-expect-error - y-websocket doesn't have proper type definitions
import { setupWSConnection } from 'y-websocket/bin/utils'

let wss: WebSocketServer | null = null

export function setupWebSocket(httpServer: HttpServer): WebSocketServer {
  // Create WebSocket server for y-websocket
  wss = new WebSocketServer({ noServer: true })

  // Handle WebSocket upgrade requests
  httpServer.on('upgrade', (request: IncomingMessage, socket, head) => {
    // Only handle y-websocket connections (paths like /doc-xxx)
    const url = request.url || ''

    if (url.startsWith('/')) {
      wss!.handleUpgrade(request, socket, head, (ws: WebSocket) => {
        wss!.emit('connection', ws, request)
      })
    } else {
      socket.destroy()
    }
  })

  // Handle WebSocket connections
  wss.on('connection', (conn: WebSocket, request: IncomingMessage) => {
    const docName = request.url?.slice(1) || 'default' // Remove leading slash
    console.log(`WebSocket client connected to document: ${docName}`)

    // Setup y-websocket connection
    setupWSConnection(conn, request, {
      docName: docName,
      gc: true // Enable garbage collection for deleted items
    })

    conn.on('close', () => {
      console.log(`WebSocket client disconnected from document: ${docName}`)
    })

    conn.on('error', (error: Error) => {
      console.error('WebSocket error:', error)
    })
  })

  console.log('Y-WebSocket server initialized')
  return wss
}

export function getWSS(): WebSocketServer | null {
  return wss
}
