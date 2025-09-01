<template>
  <div class="pokemon-grid-container">
    <!-- Loading State -->
    <div v-if="pokemonStore.isLoading && pokemonStore.allPokemon.length === 0" class="loading-grid">
      <div
        v-for="i in 16"
        :key="`loading-${i}`"
        class="loading-card"
      />
    </div>

    <!-- Progressive Loading Indicator -->
    <div 
      v-else-if="pokemonStore.isLoading && pokemonStore.allPokemon.length > 0" 
      class="loading-progress mb-6"
    >
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-blue-700">Loading Pokemon data...</div>
          <div class="text-sm text-blue-600 font-medium">
            {{ pokemonStore.allPokemon.length }} loaded
          </div>
        </div>
        <div class="mt-2 bg-blue-200 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${Math.min((pokemonStore.allPokemon.length / 1025) * 100, 100)}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!pokemonStore.isLoading && filteredPokemon.length === 0"
      class="flex flex-col items-center justify-center py-16 text-gray-500"
    >
      <div class="text-6xl mb-4">🔍</div>
      <h3 class="text-xl font-semibold mb-2">No Pokemon Found</h3>
      <p class="text-center max-w-md">
        Try adjusting your search or filter criteria to find Pokemon.
      </p>
      <button
        @click="pokemonStore.clearFilters()"
        class="btn-primary mt-4"
      >
        Clear Filters
      </button>
    </div>

    <!-- Continuous Pokemon Grid (No Generation Separation) -->
    <div v-else class="space-y-8">
      <!-- Continuous Binder Pages -->
      <div
        v-for="(page, pageIndex) in allPages"
        :key="`page-${pageIndex}`"
        :id="`page-${pageIndex + 1}`"
        class="binder-page"
      >
        <div class="binder-page-section">
          <!-- Pokemon Cards -->
          <PokemonCard
            v-for="pokemon in page"
            :key="pokemon.id"
            :pokemon="pokemon"
            :is-filtered-out="false"
          />

          <!-- Fill empty slots to complete 4x4 grid -->
          <div
            v-for="i in (16 - page.length)"
            :key="`empty-page-${pageIndex}-${i}`"
            class="empty-slot"
          />
        </div>
      </div>
    </div>

    <!-- Collection Summary -->
    <div class="mt-12 bg-gradient-to-r from-pokemon-50 to-blue-50 rounded-2xl p-6 border border-pokemon-200">
      <h3 class="text-xl font-bold text-gray-900 mb-4">Collection Summary</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <div class="text-2xl font-bold text-pokemon-600">
            {{ pokemonStore.collectionStats.collected }}
          </div>
          <div class="text-sm text-gray-600">Pokemon Collected</div>
        </div>
        
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <div class="text-2xl font-bold text-gray-600">
            {{ pokemonStore.collectionStats.total }}
          </div>
          <div class="text-sm text-gray-600">Total Pokemon</div>
        </div>
        
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <div class="text-2xl font-bold text-green-600">
            {{ pokemonStore.collectionStats.percentage }}%
          </div>
          <div class="text-sm text-gray-600">Collection Complete</div>
        </div>
      </div>

      <!-- Generation Breakdown -->
      <div class="mt-6">
        <h4 class="font-semibold text-gray-900 mb-3">By Generation</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="genStats in pokemonStore.collectionStats.byGeneration"
            :key="genStats.generation.id"
            class="bg-white rounded-lg p-3 shadow-sm"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="font-medium text-sm">Gen {{ genStats.generation.id }}</span>
              <span class="text-sm text-gray-600">
                {{ genStats.collected }}/{{ genStats.total }}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5">
              <div
                class="bg-pokemon-600 h-1.5 rounded-full transition-all duration-500"
                :style="{ width: `${genStats.percentage}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePokemonStore } from '../stores/pokemon'
import PokemonCard from './PokemonCard.vue'
import type { Pokemon } from '../types/pokemon'

const pokemonStore = usePokemonStore()

// Computed properties
const filteredPokemon = computed(() => pokemonStore.filteredPokemon)

// Create continuous pages without generation separation
const allPages = computed(() => {
  const pokemon = filteredPokemon.value
  const pages = []
  const itemsPerPage = 16 // 4x4 grid
  
  for (let i = 0; i < pokemon.length; i += itemsPerPage) {
    pages.push(pokemon.slice(i, i + itemsPerPage))
  }
  
  return pages
})

// Methods
const getPageCollectedCount = (page: Pokemon[]) => {
  return page.filter(pokemon => pokemonStore.collectionStatus[pokemon.id]).length
}
</script>

<style scoped>
.pokemon-grid-container {
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
  padding: 2rem 1rem;
}

@media (min-width: 640px) {
  .pokemon-grid-container {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .pokemon-grid-container {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.binder-page {
  scroll-margin-top: 8rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
}

.binder-page-section {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  border: 2px solid #e5e7eb;
}

.empty-slot {
  aspect-ratio: 1;
  background: #f3f4f6;
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 500;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 1rem;
}

.loading-card {
  aspect-ratio: 1;
  background: #f3f4f6;
  border-radius: 0.5rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .binder-page-section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .binder-page-section {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  .pokemon-grid-container {
    padding: 1rem 0.5rem;
  }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}
</style>
