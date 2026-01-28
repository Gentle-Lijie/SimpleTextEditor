import { watch, onMounted, onUnmounted } from 'vue'
import { useMarkdownThemeStore } from '@/stores/markdownTheme'
import type { MarkdownTheme } from '@/config/markdownThemes'

const THEME_LINK_ID = 'markdown-theme-stylesheet'

/**
 * Composable for managing Markdown theme loading
 */
export function useMarkdownTheme() {
  const themeStore = useMarkdownThemeStore()

  /**
   * Load a theme by removing old link and creating a new one
   */
  function loadTheme(theme: MarkdownTheme) {
    themeStore.setLoading(true)
    themeStore.setError(null)

    try {
      // Remove old link element if it exists
      const oldLinkElement = document.getElementById(THEME_LINK_ID)
      if (oldLinkElement) {
        oldLinkElement.remove()
      }

      // Create new link element
      const linkElement = document.createElement('link')
      linkElement.id = THEME_LINK_ID
      linkElement.rel = 'stylesheet'
      linkElement.type = 'text/css'

      // Set up load and error handlers
      const handleLoad = () => {
        themeStore.setLoading(false)
      }

      const handleError = () => {
        const errorMsg = `Failed to load theme: ${theme.name}`
        themeStore.setError(errorMsg)
        themeStore.setLoading(false)

        // Try to fallback to default theme if current theme fails
        if (theme.id !== 'github') {
          themeStore.resetToDefault()
        }
      }

      // Add event listeners
      linkElement.addEventListener('load', handleLoad, { once: true })
      linkElement.addEventListener('error', handleError, { once: true })

      // Set href and append to head (this triggers the load)
      linkElement.href = theme.cssPath
      document.head.appendChild(linkElement)
    } catch (error) {
      const errorMsg = `Error loading theme: ${error}`
      themeStore.setError(errorMsg)
      themeStore.setLoading(false)
    }
  }

  /**
   * Unload the current theme by removing the link element
   */
  function unloadTheme() {
    const linkElement = document.getElementById(THEME_LINK_ID)
    if (linkElement) {
      linkElement.remove()
    }
  }

  /**
   * Initialize theme loading
   */
  function initTheme() {
    const currentTheme = themeStore.currentTheme
    if (currentTheme) {
      loadTheme(currentTheme)
    }
  }

  /**
   * Watch for theme changes and reload
   */
  const stopWatcher = watch(
    () => themeStore.currentThemeId,
    () => {
      const newTheme = themeStore.currentTheme
      if (newTheme) {
        loadTheme(newTheme)
      }
    }
  )

  // Auto-initialize on mount
  onMounted(() => {
    initTheme()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopWatcher()
  })

  return {
    loadTheme,
    unloadTheme,
    initTheme,
    isLoading: () => themeStore.isLoading,
    loadError: () => themeStore.loadError
  }
}
