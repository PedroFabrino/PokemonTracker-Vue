<template>
  <div class="space-y-4">
    <div>
      <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Theme Preference</h4>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Choose how the app should appear, or let it follow your system setting
      </p>
    </div>

    <div class="space-y-3">
      <!-- Light Theme Option -->
      <label class="flex items-center space-x-3 cursor-pointer group">
        <input
          type="radio"
          :value="'light'"
          v-model="themeMode"
          class="h-4 w-4 text-pokemon-600 focus:ring-pokemon-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
        />
        <div class="flex items-center space-x-3 flex-1">
          <div
            class="p-2 bg-white border border-gray-200 rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
          >
            <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Light Mode</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Clean and bright interface</p>
          </div>
        </div>
      </label>

      <!-- Dark Theme Option -->
      <label class="flex items-center space-x-3 cursor-pointer group">
        <input
          type="radio"
          :value="'dark'"
          v-model="themeMode"
          class="h-4 w-4 text-pokemon-600 focus:ring-pokemon-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
        />
        <div class="flex items-center space-x-3 flex-1">
          <div
            class="p-2 bg-gray-800 border border-gray-700 rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
          >
            <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes in low light</p>
          </div>
        </div>
      </label>

      <!-- Auto/System Theme Option -->
      <label class="flex items-center space-x-3 cursor-pointer group">
        <input
          type="radio"
          :value="'auto'"
          v-model="themeMode"
          class="h-4 w-4 text-pokemon-600 focus:ring-pokemon-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
        />
        <div class="flex items-center space-x-3 flex-1">
          <div
            class="p-2 bg-gradient-to-r from-white to-gray-800 border border-gray-300 rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
          >
            <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm0 1.5h15a1.5 1.5 0 011.5 1.5v10.5a1.5 1.5 0 01-1.5 1.5h-15a1.5 1.5 0 01-1.5-1.5V6.75a1.5 1.5 0 011.5-1.5zM12 8.25a.75.75 0 00-.75.75v6a.75.75 0 001.5 0V9a.75.75 0 00-.75-.75z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100">System</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Follow your device's preference
              <span v-if="prefersDarkMode" class="text-blue-400">(currently dark)</span>
              <span v-else class="text-yellow-500">(currently light)</span>
            </p>
          </div>
        </div>
      </label>
    </div>

    <!-- Current Status -->
    <div
      class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center space-x-2">
        <div
          class="w-3 h-3 rounded-full"
          :class="isDarkMode ? 'bg-blue-400' : 'bg-yellow-400'"
        ></div>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Currently using <strong>{{ isDarkMode ? 'dark' : 'light' }}</strong> theme
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { themeMode, isDarkMode, prefersDarkMode } = useTheme()
</script>
