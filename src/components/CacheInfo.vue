<template>
  <div class="space-y-4">
    <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">Pokemon Data Cache</h4>

    <div class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
      <div v-if="cacheInfo.exists" class="space-y-2">
        <div class="flex justify-between">
          <span>Status:</span>
          <span
            class="font-medium"
            :class="
              cacheInfo.isValid
                ? 'text-green-600 dark:text-green-400'
                : 'text-yellow-600 dark:text-yellow-400'
            "
          >
            {{ cacheInfo.isValid ? 'Valid' : 'Expired' }}
          </span>
        </div>

        <div class="flex justify-between">
          <span>Pokemon cached:</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{
            cacheInfo.count?.toLocaleString()
          }}</span>
        </div>

        <div class="flex justify-between">
          <span>Cache age:</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">
            {{
              cacheInfo.ageDays === 0
                ? 'Less than 1 day'
                : `${cacheInfo.ageDays} day${cacheInfo.ageDays !== 1 ? 's' : ''}`
            }}
          </span>
        </div>

        <div class="flex justify-between">
          <span>Cache version:</span>
          <span class="font-medium text-gray-900 dark:text-gray-100">{{ cacheInfo.version }}</span>
        </div>
      </div>

      <div v-else class="text-center py-2">
        <span class="text-gray-500 dark:text-gray-400">No cache found</span>
      </div>
    </div>

    <!-- Cache Actions -->
    <div class="flex gap-2 pt-2">
      <button
        @click="refreshCache"
        :disabled="isRefreshing"
        class="flex-1 px-3 py-2 text-xs bg-pokemon-600 text-white rounded-md hover:bg-pokemon-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {{ isRefreshing ? 'Refreshing...' : 'Refresh Cache' }}
      </button>

      <button
        v-if="cacheInfo.exists"
        @click="clearCache"
        class="px-3 py-2 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Clear Cache
      </button>
    </div>

    <div class="text-xs text-gray-500 dark:text-gray-400">
      Cache expires after 1 year or when app version changes. Pokemon data is downloaded once and
      stored locally for faster loading.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { usePokemonServices } from '../composables/usePokemonServices'
import { pokemonCache } from '../services/pokemonCache'

const { getCacheInfo, refreshPokemonCache } = usePokemonServices()

const cacheInfo = ref({
  exists: false,
  age: 0,
  ageDays: 0,
  count: 0,
  version: '',
  isValid: false,
})

const isRefreshing = ref(false)

const updateCacheInfo = () => {
  const info = getCacheInfo()
  cacheInfo.value = {
    exists: info.exists,
    age: info.age || 0,
    ageDays: info.ageDays || 0,
    count: info.count || 0,
    version: info.version || '',
    isValid: info.isValid || false,
  }
}

const refreshCache = async () => {
  isRefreshing.value = true
  try {
    await refreshPokemonCache()
    updateCacheInfo()
  } catch (error) {
    console.error('Failed to refresh cache:', error)
  } finally {
    isRefreshing.value = false
  }
}

const clearCache = () => {
  pokemonCache.clearCache()
  updateCacheInfo()
}

// Update cache info periodically
let intervalId: number | null = null

onMounted(() => {
  updateCacheInfo()
  // Update every 30 seconds while modal is open
  intervalId = window.setInterval(updateCacheInfo, 30000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>
