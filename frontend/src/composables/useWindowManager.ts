import { ref, onMounted, onUnmounted } from 'vue'

const CHANNEL_NAME = 'simpletexteditor-window-manager'
const WINDOW_ID_KEY = 'simpletexteditor-active-window'

// Generate unique window ID
function generateWindowId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function useWindowManager() {
  const isActive = ref(true)
  const windowId = generateWindowId()

  let channel: BroadcastChannel | null = null

  function takeOver() {
    // Broadcast takeover message to all other windows
    if (channel) {
      channel.postMessage({ type: 'takeover', windowId })
    }
    // Also store in localStorage as backup for browsers without BroadcastChannel
    localStorage.setItem(WINDOW_ID_KEY, windowId)
    isActive.value = true
  }

  function handleMessage(event: MessageEvent) {
    if (event.data.type === 'takeover' && event.data.windowId !== windowId) {
      // Another window is taking over, deactivate this one
      isActive.value = false
    }
  }

  function handleStorageChange(event: StorageEvent) {
    // Fallback for browsers without BroadcastChannel
    if (event.key === WINDOW_ID_KEY && event.newValue !== windowId) {
      isActive.value = false
    }
  }

  function reclaim() {
    // Refresh/reclaim active status
    takeOver()
  }

  onMounted(() => {
    // Create broadcast channel
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CHANNEL_NAME)
      channel.addEventListener('message', handleMessage)
    }

    // Listen to storage changes as fallback
    window.addEventListener('storage', handleStorageChange)

    // Take over on mount
    takeOver()
  })

  onUnmounted(() => {
    if (channel) {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
    window.removeEventListener('storage', handleStorageChange)
  })

  return {
    isActive,
    windowId,
    reclaim
  }
}
