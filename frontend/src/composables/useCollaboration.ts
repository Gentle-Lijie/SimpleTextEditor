import { ref, onUnmounted, watch, type Ref } from 'vue'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import type { CollaborationUser } from '@/types'
import { useEditorStore } from '@/stores/editor'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'

// LocalStorage keys for user info
const USER_NAME_KEY = 'simpletexteditor-username'
const USER_COLOR_KEY = 'simpletexteditor-usercolor'

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

// Get saved user name from localStorage or generate new one
function getSavedUserName(): string {
  const saved = localStorage.getItem(USER_NAME_KEY)
  if (saved) return saved
  const newName = getRandomName()
  localStorage.setItem(USER_NAME_KEY, newName)
  return newName
}

// Get saved user color from localStorage or generate new one
function getSavedUserColor(): string {
  const saved = localStorage.getItem(USER_COLOR_KEY)
  if (saved) return saved
  const newColor = getRandomColor()
  localStorage.setItem(USER_COLOR_KEY, newColor)
  return newColor
}

export function useCollaboration(documentIdRef: Ref<string> | string) {
  const editorStore = useEditorStore()

  // Track current document ID
  const currentDocId = ref(typeof documentIdRef === 'string' ? documentIdRef : documentIdRef.value)

  let ydoc = new Y.Doc()
  let ytext = ydoc.getText('content')

  const connected = ref(false)
  const users = ref<CollaborationUser[]>([])
  // Keep user info consistent across document switches (persisted in localStorage)
  const userName = getSavedUserName()
  const userColor = getSavedUserColor()
  const currentUser = ref<CollaborationUser>({
    id: ydoc.clientID.toString(),
    name: userName,
    color: userColor
  })

  let provider: WebsocketProvider | null = null
  let isUpdatingFromYjs = false
  let isUpdatingFromStore = false
  let stopStoreWatch: (() => void) | null = null

  // Sync Y.Text changes to store
  function onYTextChange() {
    if (isUpdatingFromStore) return
    isUpdatingFromYjs = true
    const newContent = ytext.toString()
    if (editorStore.content !== newContent) {
      editorStore.setContent(newContent)
    }
    isUpdatingFromYjs = false
  }

  // Sync store changes to Y.Text
  function syncStoreToYText() {
    if (isUpdatingFromYjs) return
    isUpdatingFromStore = true

    const storeContent = editorStore.content
    const ytextContent = ytext.toString()

    if (storeContent !== ytextContent) {
      // Calculate diff and apply minimal changes
      ydoc.transact(() => {
        ytext.delete(0, ytextContent.length)
        ytext.insert(0, storeContent)
      })
    }

    isUpdatingFromStore = false
  }

  // Setup store watch
  function setupStoreWatch() {
    if (stopStoreWatch) {
      stopStoreWatch()
    }
    stopStoreWatch = watch(() => editorStore.content, syncStoreToYText)
  }

  // Connect to collaboration server for a specific document
  function connect(docId?: string) {
    // If docId provided and different from current, switch rooms
    const targetDocId = docId || currentDocId.value

    // If already connected to this document, do nothing
    if (provider && currentDocId.value === targetDocId) return

    // Disconnect from current room if connected
    if (provider) {
      disconnectInternal()
    }

    // Update current doc ID
    currentDocId.value = targetDocId

    // Create new Y.Doc for this document
    ydoc = new Y.Doc()
    ytext = ydoc.getText('content')

    // Update current user with new client ID
    currentUser.value.id = ydoc.clientID.toString()

    // Track if initial sync is done to prevent duplicate content
    let initialSyncDone = false

    provider = new WebsocketProvider(
      WS_URL,
      `doc-${targetDocId}`,
      ydoc,
      { connect: true }
    )

    // Handle sync event - this fires when initial data is received from server
    provider.on('sync', (isSynced: boolean) => {
      if (isSynced && !initialSyncDone) {
        initialSyncDone = true

        // After sync, decide content source:
        // - If Y.Text has content from server, use it (collaborative truth)
        // - If Y.Text is empty but store has content, sync store to Y.Text
        const ytextContent = ytext.toString()
        if (ytextContent) {
          // Server has content, use it
          isUpdatingFromYjs = true
          editorStore.setContent(ytextContent)
          isUpdatingFromYjs = false
        } else if (editorStore.content) {
          // Server is empty, initialize from store
          syncStoreToYText()
        }

        // Only start watching store changes AFTER initial sync
        setupStoreWatch()
      }
    })

    // Handle connection status
    provider.on('status', (event: { status: string }) => {
      connected.value = event.status === 'connected'
    })

    // Listen to Y.Text changes
    ytext.observe(onYTextChange)

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
            cursor: state.cursor,
            selection: state.selection
          })
        }
      })

      users.value = userList
    })
  }

  // Internal disconnect (without destroying everything)
  function disconnectInternal() {
    if (provider) {
      ytext.unobserve(onYTextChange)
      provider.disconnect()
      provider.destroy()
      provider = null
    }
    if (stopStoreWatch) {
      stopStoreWatch()
      stopStoreWatch = null
    }
    connected.value = false
    users.value = []
  }

  // Disconnect from collaboration server
  function disconnect() {
    disconnectInternal()
  }

  // Switch to a different document
  function switchDocument(newDocId: string) {
    if (newDocId === currentDocId.value) return
    connect(newDocId)
  }

  // Update cursor position in awareness
  function updateCursor(line: number, column: number, index?: number) {
    if (provider) {
      provider.awareness.setLocalStateField('cursor', { line, column, index })
    }
  }

  // Update selection in awareness
  function updateSelection(start: number, end: number) {
    if (provider) {
      provider.awareness.setLocalStateField('selection', { start, end })
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

  // Get provider for awareness
  function getProvider(): WebsocketProvider | null {
    return provider
  }

  // Set user name
  // Set user name and persist to localStorage
  function setUserName(name: string) {
    currentUser.value.name = name
    localStorage.setItem(USER_NAME_KEY, name)
    if (provider) {
      provider.awareness.setLocalStateField('user', {
        ...currentUser.value
      })
    }
  }

  // Apply local change to Y.Text (for collaborative editing)
  function applyLocalChange(index: number, deleteCount: number, insertText: string) {
    if (isUpdatingFromYjs) return
    isUpdatingFromStore = true
    ydoc.transact(() => {
      if (deleteCount > 0) {
        ytext.delete(index, deleteCount)
      }
      if (insertText) {
        ytext.insert(index, insertText)
      }
    })
    isUpdatingFromStore = false
  }

  // Watch for document ID changes if ref is provided
  let stopDocIdWatch: (() => void) | null = null
  if (typeof documentIdRef !== 'string') {
    stopDocIdWatch = watch(documentIdRef, (newDocId) => {
      if (newDocId && newDocId !== currentDocId.value) {
        switchDocument(newDocId)
      }
    })
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (stopStoreWatch) {
      stopStoreWatch()
    }
    if (stopDocIdWatch) {
      stopDocIdWatch()
    }
    disconnectInternal()
    ydoc.destroy()
  })

  return {
    connected,
    users,
    currentUser,
    currentDocId,
    connect,
    disconnect,
    switchDocument,
    updateCursor,
    updateSelection,
    getYText,
    getYDoc,
    getProvider,
    setUserName,
    applyLocalChange
  }
}
