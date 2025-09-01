<template>
  <div class="binder-page-navigation">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">Quick Page Access</h3>
      <div class="text-sm text-gray-500">
        Click a page to jump to that section
      </div>
    </div>
    
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
      <button
        v-for="page in binderPages"
        :key="page.number"
        @click="scrollToPage(page)"
        class="binder-page-btn"
        :class="{ 'active': isPageActive(page) }"
      >
        <div class="text-sm font-medium">Page {{ page.number }}</div>
        <div class="text-xs text-gray-500">
          #{{ page.startId }}-{{ page.endId }}
        </div>
        <div class="text-xs">
          {{ page.collectedCount }}/{{ page.totalCount }}
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1 mt-1">
          <div
            class="bg-pokemon-600 h-1 rounded-full transition-all duration-300"
            :style="{ width: `${page.completionPercentage}%` }"
          />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { usePokemonStore } from '../stores/pokemon'

const pokemonStore = usePokemonStore()
const activePage = ref<number>(1)

interface BinderPage {
  number: number
  startId: number
  endId: number
  totalCount: number
  collectedCount: number
  completionPercentage: number
}

const binderPages = computed<BinderPage[]>(() => {
  const filteredPokemon = pokemonStore.filteredPokemon
  const pages: BinderPage[] = []
  const itemsPerPage = 16 // 4x4 grid
  
  if (filteredPokemon.length === 0) return pages
  
  const totalPages = Math.ceil(filteredPokemon.length / itemsPerPage)
  
  for (let i = 0; i < totalPages; i++) {
    const startIndex = i * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredPokemon.length - 1)
    const pagePokemon = filteredPokemon.slice(startIndex, endIndex + 1)
    
    const startId = pagePokemon[0]?.id || 0
    const endId = pagePokemon[pagePokemon.length - 1]?.id || 0
    
    const collectedCount = pagePokemon.filter(pokemon => 
      pokemonStore.collectionStatus[pokemon.id]
    ).length
    
    const completionPercentage = pagePokemon.length > 0 
      ? Math.round((collectedCount / pagePokemon.length) * 100) 
      : 0
    
    pages.push({
      number: i + 1,
      startId,
      endId,
      totalCount: pagePokemon.length,
      collectedCount,
      completionPercentage
    })
  }
  
  return pages
})

const scrollToPage = (page: BinderPage) => {
  const pokemonElement = document.querySelector(`[data-pokemon-id="${page.startId}"]`)
  if (pokemonElement) {
    const headerOffset = 140 // Account for sticky header and navigation
    const elementPosition = pokemonElement.getBoundingClientRect().top + window.pageYOffset
    const offsetPosition = elementPosition - headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
    
    activePage.value = page.number
  }
}

const isPageActive = (page: BinderPage) => {
  return activePage.value === page.number
}

const updateActivePage = () => {
  const scrollPosition = window.scrollY + 200 // Offset for header
  
  for (const page of binderPages.value) {
    const pokemonElement = document.querySelector(`[data-pokemon-id="${page.startId}"]`)
    if (pokemonElement) {
      const elementTop = pokemonElement.getBoundingClientRect().top + window.pageYOffset
      const elementBottom = elementTop + (16 * 200) // Approximate height of 16 cards
      
      if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
        activePage.value = page.number
        break
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateActivePage, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateActivePage)
})
</script>

<style scoped>
.binder-page-navigation {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border: 1px solid rgb(229, 231, 235);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.binder-page-btn {
  background-color: rgb(249, 250, 251);
  border: 1px solid rgb(229, 231, 235);
  border-radius: 0.5rem;
  padding: 0.75rem;
  transition: all 200ms;
  text-align: left;
}

.binder-page-btn:hover {
  background-color: rgb(243, 244, 246);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-color: rgb(147, 197, 253);
}

.binder-page-btn.active {
  background-color: rgb(239, 246, 255);
  border-color: rgb(59, 130, 246);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) rgba(59, 130, 246, 0.5);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
</style>
