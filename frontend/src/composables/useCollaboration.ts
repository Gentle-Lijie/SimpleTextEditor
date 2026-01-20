import { ref, onUnmounted } from 'vue'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import type { CollaborationUser } from '@/types'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'

// Random color for user
function getRandomColor(): string {
  const colors = [
    '#e53935', '#d81b60', '#8e24aa', '#5e35b1',
    '#3949ab', '#1e88e5', '#039be5', '#00acc1',
    '#00897b', '#43a047', '#7cb342', '#c0ca33',
    '#fdd835', '#ffb300', '#fb8c00', '#f4511e'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Generate random user name
function getRandomName(): string {
  const adjectives = ['快乐的', '勤劳的', '聪明的', '可爱的', '活泼的']
  const nouns = ['小猫', '小狗', '小鸟', '小兔', '小熊']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return adj + noun
}

export function useCollaboration(documentId: string) {
  const ydoc = new Y.Doc()
  const ytext = ydoc.getText('content')

  const connected = ref(false)
  const users = ref<CollaborationUser[]>([])
  const currentUser = ref<CollaborationUser>({
    id: ydoc.clientID.toString(),
    name: getRandomName(),
    color: getRandomColor()
  })

  let provider: WebsocketProvider | null = null

  // Connect to collaboration server
  function connect() {
    if (provider) return

    provider = new WebsocketProvider(
      WS_URL,
      `doc-${documentId}`,
      ydoc,
      { connect: true }
    )

    // Handle connection status
    provider.on('status', (event: { status: string }) => {
      connected.value = event.status === 'connected'
    })

    // Set user awareness
    provider.awareness.setLocalStateField('user', {
      id: currentUser.value.id,
      name: currentUser.value.name,
      color: currentUser.value.color
    })

    // Listen to awareness changes
    provider.awareness.on('change', () => {
      const states = provider!.awareness.getStates()
      const userList: CollaborationUser[] = []

      states.forEach((state, clientId) => {
        if (state.user && clientId !== ydoc.clientID) {
          userList.push({
            id: clientId.toString(),
            name: state.user.name,
            color: state.user.color,
            cursor: state.cursor
          })
        }
      })

      users.value = userList
    })
  }

  // Disconnect from collaboration server
  function disconnect() {
    if (provider) {
      provider.disconnect()
      provider.destroy()
      provider = null
    }
    connected.value = false
    users.value = []
  }

  // Update cursor position in awareness
  function updateCursor(line: number, column: number) {
    if (provider) {
      provider.awareness.setLocalStateField('cursor', { line, column })
    }
  }

  // Get Y.Text for binding to editor
  function getYText(): Y.Text {
    return ytext
  }

  // Get Y.Doc
  function getYDoc(): Y.Doc {
    return ydoc
  }

  // Set user name
  function setUserName(name: string) {
    currentUser.value.name = name
    if (provider) {
      provider.awareness.setLocalStateField('user', {
        ...currentUser.value
      })
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
    ydoc.destroy()
  })

  return {
    connected,
    users,
    currentUser,
    connect,
    disconnect,
    updateCursor,
    getYText,
    getYDoc,
    setUserName
  }
}
