import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'

let io: Server | null = null

export function setupWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  })

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`)

    // Join document room
    socket.on('join-room', (data: { documentId: string; userId: string; userName: string; userColor: string }) => {
      const { documentId, userId, userName, userColor } = data
      socket.join(documentId)

      // Notify others in the room
      socket.to(documentId).emit('user-joined', {
        id: userId,
        name: userName,
        color: userColor
      })

      console.log(`User ${userName} joined room ${documentId}`)
    })

    // Leave document room
    socket.on('leave-room', (data: { documentId: string; userId: string }) => {
      const { documentId, userId } = data
      socket.leave(documentId)

      // Notify others in the room
      socket.to(documentId).emit('user-left', { id: userId })

      console.log(`User ${userId} left room ${documentId}`)
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })

  return io
}

export function getIO(): Server | null {
  return io
}
