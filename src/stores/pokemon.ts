import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Pokemon, Generation } from '../types/pokemon'

export interface CollectionStatus {
  [pokemonId: number]: boolean
}

export interface PokemonFilters {
  searchQuery: string
  selectedGeneration: string | null
  showCollectedOnly: boolean
}

export const usePokemonStore = defineStore('pokemon', () => {
  // State
  const allPokemon = ref<Pokemon[]>([])
  const collectionStatus = ref<CollectionStatus>({})
  const filters = ref<PokemonFilters>({
    searchQuery: '',
    selectedGeneration: null,
    showCollectedOnly: false
  })
  const isLoading = ref(false)
  const isAuthenticated = ref(false)
  const authError = ref<string | null>(null)
  const lastSyncTime = ref<Date | null>(null)

  // Generations data
  const generations: Generation[] = [
    { id: 1, name: 'Generation I', region: 'Kanto', startId: 1, endId: 151 },
    { id: 2, name: 'Generation II', region: 'Johto', startId: 152, endId: 251 },
    { id: 3, name: 'Generation III', region: 'Hoenn', startId: 252, endId: 386 },
    { id: 4, name: 'Generation IV', region: 'Sinnoh', startId: 387, endId: 493 },
    { id: 5, name: 'Generation V', region: 'Unova', startId: 494, endId: 649 },
    { id: 6, name: 'Generation VI', region: 'Kalos', startId: 650, endId: 721 },
    { id: 7, name: 'Generation VII', region: 'Alola', startId: 722, endId: 809 },
    { id: 8, name: 'Generation VIII', region: 'Galar', startId: 810, endId: 905 },
    { id: 9, name: 'Generation IX', region: 'Paldea', startId: 906, endId: 1025 }
  ]

  // Computed
  const filteredPokemon = computed(() => {
    let result = allPokemon.value

    // Search filter
    if (filters.value.searchQuery) {
      const query = filters.value.searchQuery.toLowerCase()
      result = result.filter(pokemon => 
        pokemon.name.toLowerCase().includes(query) ||
        pokemon.id.toString().includes(query)
      )
    }

    // Generation filter
    if (filters.value.selectedGeneration) {
      const genId = parseInt(filters.value.selectedGeneration)
      const generation = generations.find(g => g.id === genId)
      if (generation) {
        result = result.filter(pokemon => 
          pokemon.id >= generation.startId && pokemon.id <= generation.endId
        )
      }
    }

    // Collection status filter
    if (filters.value.showCollectedOnly) {
      result = result.filter(pokemon => collectionStatus.value[pokemon.id])
    }

    return result
  })

  const pokemonByGeneration = computed(() => {
    const grouped = new Map<number, Pokemon[]>()
    
    filteredPokemon.value.forEach(pokemon => {
      const generation = generations.find(g => 
        pokemon.id >= g.startId && pokemon.id <= g.endId
      )
      if (generation) {
        if (!grouped.has(generation.id)) {
          grouped.set(generation.id, [])
        }
        grouped.get(generation.id)!.push(pokemon)
      }
    })

    return grouped
  })

  const collectionStats = computed(() => {
    const total = allPokemon.value.length
    const collected = Object.values(collectionStatus.value).filter(Boolean).length
    const percentage = total > 0 ? Math.round((collected / total) * 100) : 0

    const byGeneration = generations.map(gen => {
      const genPokemon = allPokemon.value.filter(p => 
        p.id >= gen.startId && p.id <= gen.endId
      )
      const genCollected = genPokemon.filter(p => collectionStatus.value[p.id]).length
      const genPercentage = genPokemon.length > 0 ? Math.round((genCollected / genPokemon.length) * 100) : 0

      return {
        generation: gen,
        total: genPokemon.length,
        collected: genCollected,
        percentage: genPercentage
      }
    })

    return {
      total,
      collected,
      percentage,
      byGeneration
    }
  })

  // Actions
  const setPokemonData = (pokemon: Pokemon[]) => {
    allPokemon.value = pokemon
  }

  const setCollectionStatus = (status: CollectionStatus) => {
    collectionStatus.value = status
  }

  const togglePokemonCollected = async (pokemonId: number, syncCallback?: (id: number, isCollected: boolean) => Promise<void>) => {
    const newStatus = !collectionStatus.value[pokemonId]
    collectionStatus.value[pokemonId] = newStatus
    lastSyncTime.value = new Date()
    
    // Automatically sync to Google Sheets if callback is provided
    if (syncCallback) {
      try {
        await syncCallback(pokemonId, newStatus)
      } catch (error) {
        console.error('Failed to sync to Google Sheets:', error)
        // Optionally, you could revert the local change here
        // collectionStatus.value[pokemonId] = !newStatus
      }
    }
  }

  const updateFilters = (newFilters: Partial<PokemonFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const setSearchQuery = (query: string) => {
    filters.value.searchQuery = query
  }

  const setGenerationFilter = (generationId: string | null) => {
    filters.value.selectedGeneration = generationId
  }

  const toggleCollectedFilter = () => {
    filters.value.showCollectedOnly = !filters.value.showCollectedOnly
  }

  const clearFilters = () => {
    filters.value = {
      searchQuery: '',
      selectedGeneration: null,
      showCollectedOnly: false
    }
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setAuthenticated = (authenticated: boolean) => {
    isAuthenticated.value = authenticated
    if (!authenticated) {
      authError.value = null
    }
  }

  const setAuthError = (error: string | null) => {
    authError.value = error
  }

  const updateSyncTime = () => {
    lastSyncTime.value = new Date()
  }

  const getPokemonById = (id: number): Pokemon | undefined => {
    return allPokemon.value.find(pokemon => pokemon.id === id)
  }

  const getGenerationForPokemon = (pokemonId: number): Generation | undefined => {
    return generations.find(gen => 
      pokemonId >= gen.startId && pokemonId <= gen.endId
    )
  }

  const isCollected = (pokemonId: number): boolean => {
    return !!collectionStatus.value[pokemonId]
  }

  // Export everything for use in components
  return {
    // State
    allPokemon,
    collectionStatus,
    filters,
    isLoading,
    isAuthenticated,
    authError,
    lastSyncTime,
    generations,
    
    // Computed
    filteredPokemon,
    pokemonByGeneration,
    collectionStats,
    
    // Actions
    setPokemonData,
    setCollectionStatus,
    togglePokemonCollected,
    updateFilters,
    setSearchQuery,
    setGenerationFilter,
    toggleCollectedFilter,
    clearFilters,
    setLoading,
    setAuthenticated,
    setAuthError,
    updateSyncTime,
    getPokemonById,
    getGenerationForPokemon,
    isCollected
  }
})
