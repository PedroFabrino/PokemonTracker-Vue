<!-- Virtual Pokemon Grid that only renders visible cards -->
<template>
  <div class="pokemon-grid-container px-2 sm:px-4 lg:px-8 py-8">
    <!-- Loading State -->
    <div v-if="pokemonStore.isLoading" class="loading-grid">
      <div v-for="i in 16" :key="`loading-${i}`" class="loading-card" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredPokemon.length === 0"
      class="flex flex-col items-center justify-center py-16 text-gray-500"
    >
      <div class="text-6xl mb-4">🔍</div>
      <h3 class="text-xl font-semibold mb-2">No Pokemon Found</h3>
      <p class="text-center max-w-md">
        Try adjusting your search or filter criteria to find Pokemon.
      </p>
      <button @click="pokemonStore.clearFilters()" class="btn-primary mt-4">Clear Filters</button>
    </div>

    <!-- Pokemon Grid - All Pokemon at once -->
    <div v-else class="pokemon-pages">
      <div
        v-for="(page, pageIndex) in allPages"
        :key="`page-${pageIndex + 1}`"
        :id="`page-${pageIndex + 1}`"
        class="pokemon-page mb-8"
      >
        <div class="pokemon-grid">
          <PokemonCard
            v-for="pokemon in page"
            :key="`pokemon-${pokemon.id}`"
            :pokemon="pokemon"
            :is-filtered-out="false"
          />
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

// Create pages from all filtered Pokemon (no virtual scrolling)
const allPages = computed(() => {
  const pokemon = filteredPokemon.value
  const pages = []
  const itemsPerPage = 16 // 4x4 grid

  for (let i = 0; i < pokemon.length; i += itemsPerPage) {
    pages.push(pokemon.slice(i, i + itemsPerPage))
  }

  return pages
})

// Simple scroll to page function
const scrollToPage = (pageNumber: number) => {
  const element = document.getElementById(`page-${pageNumber}`)
  if (element) {
    const headerOffset = 120 // Account for sticky header
    const elementPosition = element.offsetTop
    const offsetPosition = elementPosition - headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    })
  }
}

// Expose scrollToPage for parent components
defineExpose({
  scrollToPage,
})
</script>

<style scoped>
.pokemon-page {
  margin-bottom: 2rem;
}

.pokemon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 0 auto;
  max-width: 1200px;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 0 auto;
  max-width: 1200px;
  padding: 2rem 0;
}

.loading-card {
  aspect-ratio: 3/4;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 0.75rem;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1024px) {
  .pokemon-grid {
    grid-template-columns: repeat(3, 1fr);
    max-width: 900px;
  }
}

@media (max-width: 768px) {
  .pokemon-grid {
    grid-template-columns: repeat(2, 1fr);
    max-width: 600px;
  }
}

@media (max-width: 480px) {
  .pokemon-grid {
    grid-template-columns: 1fr;
    max-width: 300px;
  }
}
</style>
