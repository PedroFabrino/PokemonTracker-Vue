import { ref, computed, watch, onMounted } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const useTheme = () => {
  // Persistent theme preference
  const themeMode = useLocalStorage<ThemeMode>('pokemon-tracker-theme', 'auto')

  // System theme detection
  const prefersDarkMode = ref(false)

  // Current active theme
  const isDarkMode = computed(() => {
    if (themeMode.value === 'dark') return true
    if (themeMode.value === 'light') return false
    return prefersDarkMode.value // auto mode follows system
  })

  // Theme display name
  const themeDisplayName = computed(() => {
    switch (themeMode.value) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'auto':
        return 'System'
      default:
        return 'System'
    }
  })

  // Update DOM classes
  const updateThemeClass = () => {
    const html = document.documentElement
    if (isDarkMode.value) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  // Set theme mode
  const setThemeMode = (mode: ThemeMode) => {
    themeMode.value = mode
  }

  // Cycle through theme modes
  const cycleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'auto']
    const currentIndex = modes.indexOf(themeMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    setThemeMode(modes[nextIndex])
  }

  // Initialize theme system
  const initializeTheme = () => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    prefersDarkMode.value = mediaQuery.matches

    // Listen for system theme changes
    mediaQuery.addEventListener('change', (e) => {
      prefersDarkMode.value = e.matches
    })

    // Apply initial theme
    updateThemeClass()
  }

  // Watch for theme changes
  watch(isDarkMode, updateThemeClass, { immediate: false })

  // Initialize on mount
  onMounted(initializeTheme)

  return {
    themeMode,
    isDarkMode,
    themeDisplayName,
    prefersDarkMode,
    setThemeMode,
    cycleTheme,
    initializeTheme,
  }
}
