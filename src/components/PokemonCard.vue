<template>
  <div
    :data-pokemon-id="pokemon.id"
    :class="[
      'pokemon-card',
      {
        collected: isCollected,
        uncaught: !isCollected,
        'filtered-out': isFilteredOut,
      },
    ]"
    @click="toggleCollection"
  >
    <!-- Collection Status Indicator -->
    <div v-if="isCollected" class="absolute top-2 right-2 z-10">
      <div class="bg-green-500 rounded-full p-1">
        <CheckIcon class="h-4 w-4 text-white" />
      </div>
    </div>

    <!-- Pokemon Number -->
    <div class="absolute top-2 left-2 z-10">
      <span class="bg-black/50 text-white px-2 py-1 rounded-md text-xs font-bold">
        #{{ pokemon.id.toString().padStart(3, '0') }}
      </span>
    </div>

    <!-- Pokemon Image -->
    <div class="flex items-center justify-center p-3 h-32">
      <img
        :key="imageKey"
        :src="spriteUrl"
        :alt="pokemon.name"
        class="pokemon-sprite max-h-full max-w-full"
        @error="handleImageError"
        loading="lazy"
      />
    </div>

    <!-- Pokemon Info -->
    <div class="px-2 pb-2">
      <!-- Name -->
      <h3 class="font-bold text-gray-900 dark:text-gray-100 text-center mb-1 truncate text-sm">
        {{ formatPokemonName(pokemon.name) }}
      </h3>

      <!-- Types -->
      <div class="flex justify-center gap-1 mb-1">
        <span
          v-for="type in pokemon.types"
          :key="type.type.name"
          :class="[
            'px-1.5 py-0.5 rounded-full text-xs font-medium text-white',
            getTypeColorClass(type.type.name),
          ]"
        >
          {{ formatTypeName(type.type.name) }}
        </span>
      </div>

      <!-- Generation Badge -->
      <div class="flex justify-center">
        <span
          class="generation-badge bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs px-1.5 py-0.5"
        >
          {{ generationInfo?.name }}
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-white/80 dark:bg-gray-700/80 flex items-center justify-center"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-pokemon-600"></div>
    </div>

    <!-- Hover Tooltip -->
    <FloatingVue v-model="showTooltip" :distance="12" placement="top">
      <template #popper>
        <div class="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs">
          <div class="font-bold text-center mb-2">
            {{ formatPokemonName(pokemon.name) }} #{{ pokemon.id }}
          </div>

          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-gray-300">Height:</span>
              <span class="ml-1">{{ (pokemon.height / 10).toFixed(1) }}m</span>
            </div>
            <div>
              <span class="text-gray-300">Weight:</span>
              <span class="ml-1">{{ (pokemon.weight / 10).toFixed(1) }}kg</span>
            </div>
          </div>

          <div class="mt-2">
            <div class="text-gray-300 text-sm mb-1">Base Stats:</div>
            <div class="space-y-1">
              <div
                v-for="stat in pokemon.stats.slice(0, 3)"
                :key="stat.stat.name"
                class="flex justify-between text-xs"
              >
                <span>{{ formatStatName(stat.stat.name) }}:</span>
                <span>{{ stat.base_stat }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </FloatingVue>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CheckIcon } from '@heroicons/vue/24/solid'
import FloatingVue from 'floating-vue'
import { usePokemonStore } from '../stores/pokemon'
import { useSpriteConfigStore } from '../stores/spriteConfig'
import { usePokemonServices } from '../composables/usePokemonServices'
import { POKEMON_TYPES } from '../types/pokemon'
import type { Pokemon } from '../types/pokemon'

interface Props {
  pokemon: Pokemon
  isFilteredOut?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isFilteredOut: false,
})

const pokemonStore = usePokemonStore()
const spriteConfig = useSpriteConfigStore()
const { syncPokemonToSheets, isOnlineMode } = usePokemonServices()

// Local state
const isLoading = ref(false)
const showTooltip = ref(false)

// Computed properties
const isCollected = computed(() => pokemonStore.isCollected(props.pokemon.id))

const generationInfo = computed(() => pokemonStore.getGenerationForPokemon(props.pokemon.id))

// Get the sprite URL using the configuration
const spriteUrl = computed(() => {
  const url = spriteConfig.getPokemonSpriteUrl(props.pokemon)

  // Debug logging for Pokemon ID 1
  if (props.pokemon.id === 1) {
    console.log(`🎯 PokemonCard computed spriteUrl for ${props.pokemon.name}:`, {
      url,
      selectedStyle: spriteConfig.selectedStyle,
      showShinyVariants: spriteConfig.showShinyVariants,
      timestamp: new Date().toISOString(),
    })
  }

  return url
})

// Create a reactive key that changes when sprite config changes
const imageKey = computed(() => {
  const key = `${props.pokemon.id}-${spriteConfig.selectedStyle}-${spriteConfig.showShinyVariants}`

  // Debug logging for Pokemon ID 1
  if (props.pokemon.id === 1) {
    console.log(`🔑 PokemonCard imageKey for ${props.pokemon.name}:`, key)
  }

  return key
})

// Methods
const toggleCollection = async () => {
  if (props.isFilteredOut) {
    return
  }

  console.log(`🎯 Pokemon #${props.pokemon.id} clicked - Online mode: ${isOnlineMode.value}`)
  isLoading.value = true

  try {
    // Create sync callback if online
    const syncCallback = isOnlineMode.value
      ? async (id: number, isCollected: boolean) => {
          console.log(`📤 Syncing Pokemon #${id} to Google Sheets...`)
          const result = await syncPokemonToSheets(id, isCollected)

          if (!result.success) {
            console.warn(`❌ Sync failed for Pokemon #${id}:`, result.error)
          } else {
            console.log(`✅ Sync successful for Pokemon #${id}`)
          }
        }
      : undefined

    if (!syncCallback) {
      console.log(`📴 No sync - offline mode for Pokemon #${props.pokemon.id}`)
    }

    await pokemonStore.togglePokemonCollected(props.pokemon.id, syncCallback)

    // Add visual feedback
    const card = document.querySelector(`[data-pokemon-id="${props.pokemon.id}"]`)
    if (card) {
      if (isCollected.value) {
        card.classList.add('animate-bounce')
        setTimeout(() => card.classList.remove('animate-bounce'), 600)
      }
    }
  } catch (error) {
    console.error(`❌ Error toggling collection status for Pokemon #${props.pokemon.id}:`, error)
  } finally {
    isLoading.value = false
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  const currentSrc = img.src

  // First, try official artwork if we're not already using it
  const officialArtwork = props.pokemon.sprites.other?.['official-artwork']?.front_default
  if (officialArtwork && currentSrc !== officialArtwork) {
    img.src = officialArtwork
    return
  }

  // Then fallback to front_default if different
  if (currentSrc !== props.pokemon.sprites.front_default) {
    img.src = props.pokemon.sprites.front_default
    return
  }

  // Finally use a placeholder if even front_default fails
  img.src = '/pokemon-placeholder.svg'
}

const formatPokemonName = (name: string) => {
  return name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ')
}

const formatTypeName = (type: string) => {
  return POKEMON_TYPES[type]?.name || type.charAt(0).toUpperCase() + type.slice(1)
}

const formatStatName = (statName: string) => {
  const statMap: Record<string, string> = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    'special-attack': 'Sp. Atk',
    'special-defense': 'Sp. Def',
    speed: 'Speed',
  }
  return statMap[statName] || statName
}

const getTypeColorClass = (type: string) => {
  const typeColorMap: Record<string, string> = {
    normal: 'bg-gray-400',
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    electric: 'bg-yellow-400',
    grass: 'bg-green-500',
    ice: 'bg-blue-300',
    fighting: 'bg-red-700',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-600',
    flying: 'bg-indigo-400',
    psychic: 'bg-pink-500',
    bug: 'bg-green-400',
    rock: 'bg-yellow-800',
    ghost: 'bg-purple-700',
    dragon: 'bg-indigo-700',
    dark: 'bg-gray-800',
    steel: 'bg-gray-500',
    fairy: 'bg-pink-300',
  }

  return typeColorMap[type] || 'bg-gray-400'
}
</script>

<style scoped>
.pokemon-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.pokemon-card:hover {
  transform: translateY(-4px) scale(1.02);
}

.pokemon-card.collected {
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
}

.pokemon-card.filtered-out {
  pointer-events: none;
}

.pokemon-sprite {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

@keyframes bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0) scale(1.02);
  }
  40%,
  43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -8px, 0) scale(1.02);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -4px, 0) scale(1.02);
  }
  90% {
    transform: translate3d(0, -1px, 0) scale(1.02);
  }
}

.animate-bounce {
  animation: bounce 0.6s;
}
</style>
