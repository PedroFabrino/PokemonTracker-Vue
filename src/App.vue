<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { VueFinalModal } from 'vue-final-modal'
import {
  ExclamationTriangleIcon,
  KeyIcon,
  CloudIcon,
  CheckIcon,
  Bars3Icon,
} from '@heroicons/vue/24/outline'

import AppHeader from './components/AppHeader.vue'
import VirtualPokemonGrid from './components/VirtualPokemonGrid.vue'
import { usePokemonStore } from './stores/pokemon'
import { useSpriteConfigStore } from './stores/spriteConfig'
import { usePokemonServices } from './composables/usePokemonServices'
import { useTheme } from './composables/useTheme'

const pokemonStore = usePokemonStore()
const spriteConfig = useSpriteConfigStore()
const pokemonServices = usePokemonServices()

// Initialize theme system
const theme = useTheme()

// Local state
const showAuthModal = ref(false)
const showErrorModal = ref(false)
const sidebarOpen = ref(false)
const virtualGridRef = ref()
const showSyncPopup = ref(false)

// Watch for sync time changes and show popup temporarily
watch(
  () => pokemonStore.lastSyncTime,
  (newSyncTime) => {
    if (newSyncTime) {
      showSyncPopup.value = true
      // Hide popup after 3 seconds
      setTimeout(() => {
        showSyncPopup.value = false
      }, 3000)
    }
  },
)

// Page navigation computed property
const pageNavigation = computed(() => {
  const pokemon = pokemonStore.filteredPokemon
  const pages = []
  const itemsPerPage = 16 // 4x4 grid

  for (let i = 0; i < pokemon.length; i += itemsPerPage) {
    const page = pokemon.slice(i, i + itemsPerPage)
    const startId = page[0]?.id || 0
    const endId = page[page.length - 1]?.id || 0
    const collected = page.filter((p) => pokemonStore.collectionStatus[p.id]).length
    const total = page.length
    const percentage = total > 0 ? Math.round((collected / total) * 100) : 0

    pages.push({
      startId,
      endId,
      collected,
      total,
      percentage,
    })
  }

  return pages
})

const formatSyncTime = (date: Date) => {
  return date.toLocaleTimeString()
}

// Initialize services on mount
onMounted(async () => {
  // Initialize sprite configuration from localStorage
  spriteConfig.loadConfig()

  // Initialize Pokemon services
  await pokemonServices.initializeServices()
})

const signIn = () => {
  showAuthModal.value = false
}

const retry = async () => {
  // Retry initialization
  await pokemonServices.initializeServices()
}

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const scrollToPage = (pageNumber: number) => {
  if (virtualGridRef.value?.scrollToPage) {
    console.log(`🎯 Scrolling to page ${pageNumber}`)
    virtualGridRef.value.scrollToPage(pageNumber)

    // Force refresh after a short delay to ensure rendering
    setTimeout(() => {
      if (virtualGridRef.value?.forceRefresh) {
        virtualGridRef.value.forceRefresh()
      }
    }, 100)

    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      sidebarOpen.value = false
    }
  }
}
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <AppHeader />

    <!-- Main Layout with Sidebar -->
    <div class="flex pt-4">
      <!-- Mobile Sidebar Toggle -->
      <button
        @click="toggleSidebar"
        class="lg:hidden fixed left-2 z-50 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 transition-opacity duration-300"
        :class="{ 'opacity-0 pointer-events-none': sidebarOpen }"
        style="top: calc(var(--header-height, 64px) + 8px)"
      >
        <Bars3Icon class="h-5 w-5 text-gray-600" />
      </button>

      <!-- Side Navigation Menu -->
      <aside
        class="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 fixed left-0 z-30 transition-transform duration-300 lg:translate-x-0"
        :class="{ 'translate-x-0': sidebarOpen, '-translate-x-full': !sidebarOpen }"
        style="top: var(--header-height, 64px); height: calc(100vh - var(--header-height, 64px))"
      >
        <div class="p-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Quick Page Access
          </h3>
          <div class="space-y-2 max-h-[calc(100vh-var(--header-height,64px)-8rem)] overflow-y-auto">
            <!-- Page navigation buttons -->
            <button
              v-for="(page, index) in pageNavigation"
              :key="`page-${index}`"
              @click="scrollToPage(index + 1)"
              class="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-pokemon-300 dark:hover:border-pokemon-400 transition-all duration-200"
            >
              <div class="font-medium text-sm text-gray-900 dark:text-gray-100">
                Page {{ index + 1 }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                #{{ page.startId }}-{{ page.endId }}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-300 mt-1">
                {{ page.collected }}/{{ page.total }} collected
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 mt-2">
                <div
                  class="bg-pokemon-600 h-1 rounded-full transition-all duration-300"
                  :style="{ width: `${page.percentage}%` }"
                ></div>
              </div>
            </button>

            <!-- Empty state when no data -->
            <div
              v-if="pageNavigation.length === 0"
              class="text-sm text-gray-500 dark:text-gray-400 text-center py-4"
            >
              Loading pages...
            </div>
          </div>
        </div>
      </aside>

      <!-- Sidebar Overlay for Mobile -->
      <div
        v-if="sidebarOpen"
        @click="sidebarOpen = false"
        class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
      ></div>

      <!-- Main Content Area -->
      <main class="flex-1 lg:ml-64">
        <!-- Error State -->
        <div
          v-if="pokemonServices.initError.value"
          class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-8"
        >
          <div class="bg-red-50 border border-red-200 rounded-lg p-6">
            <div class="flex">
              <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Failed to load Pokemon data</h3>
                <div class="mt-2 text-sm text-red-700">
                  {{ pokemonServices.initError.value }}
                </div>
                <div class="mt-4">
                  <button @click="retry" class="btn-primary">Retry</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pokemon Grid -->
        <VirtualPokemonGrid v-else ref="virtualGridRef" />
      </main>
    </div>

    <!-- Auth Modal -->
    <!-- Error Modal -->
    <VueFinalModal v-model="showErrorModal" classes="modal-container" content-class="modal-content">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4">
          <ExclamationTriangleIcon class="h-6 w-6 text-red-500" />
          <h3 class="text-lg font-semibold text-gray-900">Service Error</h3>
        </div>

        <p class="text-gray-600 mb-6">
          {{ pokemonServices.initError.value }}
        </p>

        <div class="flex justify-end gap-3">
          <button
            @click="showErrorModal = false"
            class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Dismiss
          </button>
          <button
            @click="retry"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    </VueFinalModal>

    <!-- Floating Action Button for Auth -->
    <div v-if="!pokemonStore.isAuthenticated && !showAuthModal" class="fixed bottom-6 right-6">
      <button
        @click="showAuthModal = true"
        class="bg-pokemon-600 text-white p-4 rounded-full shadow-lg hover:bg-pokemon-700 hover:shadow-xl transition-all duration-300"
      >
        <CloudIcon class="h-6 w-6" />
      </button>
    </div>

    <!-- Sync Status Toast -->
    <!-- Sync Popup -->
    <div
      v-if="showSyncPopup && pokemonStore.lastSyncTime"
      class="fixed bottom-6 left-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-600 transition-all duration-300 z-50"
    >
      <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <CheckIcon class="h-4 w-4 text-green-500" />
        Last sync: {{ formatSyncTime(pokemonStore.lastSyncTime) }}
      </div>
    </div>
  </div>
</template>

<style>
/* Import Tailwind styles */
@import './assets/main.css';

/* Vue Final Modal styles */
.vfm-fade-enter-active,
.vfm-fade-leave-active {
  transition: opacity 0.2s;
}

.vfm-fade-enter-from,
.vfm-fade-leave-to {
  opacity: 0;
}

/* Ensure sidebar stays at proper height */
aside {
  height: calc(100vh - 7rem);
  overflow-y: auto;
}

/* Custom scrollbar for sidebar */
aside::-webkit-scrollbar {
  width: 4px;
}

aside::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.dark aside::-webkit-scrollbar-track {
  background: #374151;
}

aside::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.dark aside::-webkit-scrollbar-thumb {
  background: #6b7280;
}

aside::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark aside::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
