import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  MARKDOWN_THEMES,
  DEFAULT_THEME_ID,
  getThemeById,
  getThemesByCategory,
  getAllCategories,
  type MarkdownTheme,
  type ThemeCategory
} from '@/config/markdownThemes'

// LocalStorage key for persisting theme selection
const THEME_STORAGE_KEY = 'simpletexteditor-markdown-theme'

// Get saved theme from localStorage or default to 'github'
function getSavedTheme(): string {
  const saved = localStorage.getItem(THEME_STORAGE_KEY)
  if (saved && getThemeById(saved)) {
    return saved
  }
  return DEFAULT_THEME_ID
}

export const useMarkdownThemeStore = defineStore('markdownTheme', () => {
  // State
  const currentThemeId = ref<string>(getSavedTheme())
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  // Computed
  const currentTheme = computed<MarkdownTheme | undefined>(() => {
    return getThemeById(currentThemeId.value)
  })

  const availableThemes = computed(() => MARKDOWN_THEMES)

  const themesByCategory = computed(() => {
    const categories = getAllCategories()
    return categories.map(category => ({
      category,
      themes: getThemesByCategory(category)
    }))
  })

  // Actions
  function setTheme(themeId: string) {
    const theme = getThemeById(themeId)
    if (!theme) {
      return
    }

    currentThemeId.value = themeId
    loadError.value = null

    // Persist theme to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, themeId)
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(error: string | null) {
    loadError.value = error
  }

  function resetToDefault() {
    setTheme(DEFAULT_THEME_ID)
  }

  return {
    // State
    currentThemeId,
    isLoading,
    loadError,
    // Computed
    currentTheme,
    availableThemes,
    themesByCategory,
    // Actions
    setTheme,
    setLoading,
    setError,
    resetToDefault
  }
})
