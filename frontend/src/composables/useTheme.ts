import { ref, watch, onMounted } from 'vue'
import type { Theme } from '@/types'

const THEME_KEY = 'simple-text-editor-theme'

export function useTheme() {
  const theme = ref<Theme>('system')
  const actualTheme = ref<'light' | 'dark'>('light')

  // Get system preference
  function getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Update actual theme based on setting
  function updateActualTheme() {
    if (theme.value === 'system') {
      actualTheme.value = getSystemTheme()
    } else {
      actualTheme.value = theme.value
    }

    // Apply to document
    document.documentElement.setAttribute('data-theme', actualTheme.value)
  }

  // Set theme
  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    localStorage.setItem(THEME_KEY, newTheme)
    updateActualTheme()
  }

  // Toggle between light and dark
  function toggleTheme() {
    const newTheme = actualTheme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  // Initialize
  onMounted(() => {
    // Load saved theme
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      theme.value = saved
    }

    updateActualTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'system') {
        updateActualTheme()
      }
    })
  })

  watch(theme, updateActualTheme)

  return {
    theme,
    actualTheme,
    setTheme,
    toggleTheme
  }
}
