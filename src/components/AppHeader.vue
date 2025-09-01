<template>
  <header
    ref="headerRef"
    :class="[
      'sticky-header',
      { 'header-hidden': isHidden }
    ]"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo and Title -->
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <img
              src="/pokeball.svg"
              alt="PokemonTracker"
              class="h-8 w-8"
            />
          </div>
          <h1 class="text-xl font-bold text-gray-900">
            PokemonTracker
          </h1>
        </div>

        <!-- Search Bar -->
        <div class="flex-1 max-w-lg mx-8">
          <div class="search-container">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search Pokemon by name or number..."
                class="w-full py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pokemon-500 focus:border-pokemon-500 outline-none transition-colors"
                @input="handleSearchInput"
                @keydown="handleKeyDown"
                @focus="showAutocomplete = true"
                @blur="handleSearchBlur"
              />
              <button
                v-if="searchQuery"
                @click="clearSearch"
                class="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <XMarkIcon class="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <!-- Autocomplete Dropdown -->
            <div
              v-if="showAutocomplete && searchSuggestions.length > 0"
              class="autocomplete-dropdown show"
            >
              <div
                v-for="(pokemon, index) in searchSuggestions"
                :key="pokemon.id"
                :class="[
                  'autocomplete-item',
                  { 'highlighted': index === selectedSuggestionIndex }
                ]"
                @mousedown="selectPokemon(pokemon)"
                @mouseenter="selectedSuggestionIndex = index"
              >
                <img
                  :src="pokemon.sprites.front_default"
                  :alt="pokemon.name"
                  class="w-8 h-8"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">
                    {{ formatPokemonName(pokemon.name) }}
                  </div>
                  <div class="text-sm text-gray-500">
                    #{{ pokemon.id.toString().padStart(3, '0') }} • {{ getGenerationName(pokemon.id) }}
                  </div>
                </div>
                <div
                  v-if="pokemonStore.isCollected(pokemon.id)"
                  class="text-green-600"
                >
                  <CheckIcon class="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Controls -->
        <div class="flex items-center gap-4">
          <!-- Generation Filter -->
          <select
            v-model="selectedGeneration"
            class="filter-select"
            @change="handleGenerationChange"
          >
            <option value="">All Generations</option>
            <option
              v-for="generation in pokemonStore.generations"
              :key="generation.id"
              :value="generation.id.toString()"
            >
              {{ generation.name }}
            </option>
          </select>

          <!-- Google Auth -->
          <div class="flex items-center gap-3">
            <!-- Auth Button -->
            <div v-if="!pokemonStore.isAuthenticated" class="google-signin-container">
              <div id="google-signin-button" ref="googleSigninButton"></div>
              <button
                v-if="!isGoogleAvailable"
                @click="handleSignIn"
                :disabled="pokemonStore.isLoading"
                class="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                :title="oAuthTooltip"
              >
                {{ signInButtonText }}
              </button>
            </div>

            <div v-else class="flex items-center gap-2">
              <!-- Sign Out Button -->
              <button
                @click="handleSignOut"
                class="px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          <!-- Collection Stats -->
          <div class="text-sm text-gray-600">
            {{ pokemonStore.collectionStats.collected }} / {{ pokemonStore.collectionStats.total }}
            ({{ pokemonStore.collectionStats.percentage }}%)
          </div>

          <!-- Settings Button -->
          <button
            @click="showSettingsModal = true"
            class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Display Settings"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <SettingsModal
      :is-open="showSettingsModal"
      @close="showSettingsModal = false"
    />
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { MagnifyingGlassIcon, XMarkIcon, CheckIcon } from '@heroicons/vue/24/outline'
import { usePokemonStore } from '../stores/pokemon'
import { usePokemonServices } from '../composables/usePokemonServices'
import type { Pokemon } from '../types/pokemon'
import SettingsModal from './SettingsModal.vue'

const pokemonStore = usePokemonStore()
const { signIn, signOut, renderGoogleSignInButton } = usePokemonServices()

// Header visibility state
const headerRef = ref<HTMLElement>()
const isHidden = ref(false)
const lastScrollY = ref(0)
const scrollThreshold = 10

// Search state
const searchQuery = ref('')
const showAutocomplete = ref(false)
const selectedSuggestionIndex = ref(-1)

// Filter state
const selectedGeneration = ref('')

// Settings modal state
const showSettingsModal = ref(false)

// Google sign-in button
const googleSigninButton = ref<HTMLElement>()
const isGoogleAvailable = ref(false)

// OAuth configuration computed properties
const hasOAuthClientId = computed(() => !!import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID)
const oAuthTooltip = computed(() => 
  !hasOAuthClientId.value ? 'Google OAuth not configured' : 'Google services unavailable'
)
const signInButtonText = computed(() => {
  if (pokemonStore.isLoading) return 'Signing in...'
  if (!hasOAuthClientId.value) return 'Sign in (Config Missing)'
  return 'Sign in (Demo)'
})

// Google Auth handlers
const handleSignIn = async () => {
  const result = await signIn()
  if (!result.success) {
    console.error('Sign in failed:', result.error)
  }
}

const handleSignOut = async () => {
  await signOut()
}

// Auto-hide header on scroll
const handleScroll = () => {
  if (!headerRef.value) return

  const currentScrollY = window.scrollY

  if (Math.abs(currentScrollY - lastScrollY.value) < scrollThreshold) {
    return
  }

  if (currentScrollY > lastScrollY.value && currentScrollY > 100) {
    // Scrolling down - hide header
    isHidden.value = true
  } else {
    // Scrolling up - show header
    isHidden.value = false
  }

  lastScrollY.value = currentScrollY
}

// Search functionality
const searchSuggestions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    return []
  }

  const query = searchQuery.value.toLowerCase()
  return pokemonStore.allPokemon
    .filter(pokemon => 
      pokemon.name.toLowerCase().includes(query) ||
      pokemon.id.toString().includes(query)
    )
    .slice(0, 8) // Limit to 8 suggestions
})

const handleSearchInput = () => {
  // Don't filter the main list - only show autocomplete
  selectedSuggestionIndex.value = -1
  showAutocomplete.value = searchQuery.value.length >= 2
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (!showAutocomplete.value || searchSuggestions.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        searchSuggestions.value.length - 1
      )
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedSuggestionIndex.value >= 0) {
        selectPokemon(searchSuggestions.value[selectedSuggestionIndex.value])
      }
      break
    case 'Escape':
      showAutocomplete.value = false
      selectedSuggestionIndex.value = -1
      break
  }
}

const handleSearchBlur = () => {
  // Delay hiding to allow click on suggestions
  setTimeout(() => {
    showAutocomplete.value = false
    selectedSuggestionIndex.value = -1
  }, 200)
}

const selectPokemon = (pokemon: Pokemon) => {
  // Clear the search to show all Pokemon
  searchQuery.value = ''
  pokemonStore.setSearchQuery('')
  showAutocomplete.value = false
  selectedSuggestionIndex.value = -1

  // Scroll to the Pokemon card
  nextTick(() => {
    const pokemonCard = document.querySelector(`[data-pokemon-id="${pokemon.id}"]`)
    if (pokemonCard) {
      pokemonCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Add highlight effect
      pokemonCard.classList.add('highlight-pokemon')
      setTimeout(() => {
        pokemonCard.classList.remove('highlight-pokemon')
      }, 3000)
    }
  })
}

const clearSearch = () => {
  searchQuery.value = ''
  showAutocomplete.value = false
}

const handleGenerationChange = () => {
  pokemonStore.setGenerationFilter(selectedGeneration.value || null)
}

const formatPokemonName = (name: string) => {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const getGenerationName = (pokemonId: number) => {
  const generation = pokemonStore.generations.find(gen => 
    pokemonId >= gen.startId && pokemonId <= gen.endId
  )
  return generation ? `Gen ${generation.id}` : 'Unknown'
}

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  // Initialize filters from store
  searchQuery.value = pokemonStore.filters.searchQuery
  selectedGeneration.value = pokemonStore.filters.selectedGeneration || ''
  
  // Render Google Sign-In button after a short delay to ensure Google scripts are loaded
  setTimeout(() => {
    if (googleSigninButton.value) {
      const success = renderGoogleSignInButton(googleSigninButton.value)
      isGoogleAvailable.value = success
    }
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.header-hidden {
  transform: translateY(-100%);
}

.autocomplete-item:hover {
  background-color: theme('colors.gray.50');
}

.autocomplete-item.highlighted {
  background-color: theme('colors.pokemon.50');
}

:global(.highlight-pokemon) {
  animation: highlightPulse 3s ease-in-out;
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  z-index: 10;
  position: relative;
}

@keyframes highlightPulse {
  0% {
    box-shadow: 0 0 0 rgba(59, 130, 246, 0.5);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0 rgba(59, 130, 246, 0.5);
    transform: scale(1);
  }
}

.google-signin-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

#google-signin-button {
  min-height: 40px;
}
</style>
