<template>
  <div class="sprite-config">
    <div class="space-y-4">
      <!-- Sprite Style Selection -->
      <div class="form-group">
        <label for="sprite-style" class="block text-sm font-medium text-gray-700 mb-2">
          Sprite Style
        </label>
        <select
          id="sprite-style"
          v-model="spriteConfig.selectedStyle"
          @change="handleStyleChange"
          class="filter-select w-full"
        >
          <option
            v-for="option in spriteConfig.spriteOptions"
            :key="option.id"
            :value="option.id"
          >
            {{ option.name }}
          </option>
        </select>
        <p class="text-xs text-gray-500 mt-1">
          {{ spriteConfig.currentOption.description }}
        </p>
        <p class="text-xs text-blue-600 mt-1 font-medium">
          Current: {{ spriteConfig.selectedStyle }}
          {{ spriteConfig.showShinyVariants ? '(Shiny Mode)' : '' }}
        </p>
      </div>

      <!-- Shiny Variants Toggle -->
      <div class="form-group">
        <label class="flex items-center space-x-3">
          <input
            type="checkbox"
            v-model="spriteConfig.showShinyVariants"
            @change="handleShinyChange"
            class="h-4 w-4 text-pokemon-600 focus:ring-pokemon-500 border-gray-300 rounded"
          >
          <span class="text-sm font-medium text-gray-700">
            Show Shiny Variants
          </span>
        </label>
        <p class="text-xs text-gray-500 mt-1 ml-7">
          Display shiny versions of Pokemon when available
        </p>
      </div>

      <!-- Preview Section -->
      <div class="form-group">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Preview
        </label>
        <div class="sprite-preview bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
          <div class="flex items-center justify-center space-x-4">
            <div class="preview-card bg-white rounded-lg shadow-sm p-3 border">
              <div class="w-20 h-20 flex items-center justify-center">
                <img
                  v-if="previewPokemon"
                  :src="spriteConfig.getPokemonSpriteUrl(previewPokemon)"
                  :alt="previewPokemon.name"
                  class="w-full h-full object-contain"
                  @error="handleImageError"
                >
                <div v-else class="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                  <span class="text-gray-400 text-xs">Loading...</span>
                </div>
              </div>
              <p class="text-xs text-center text-gray-600 mt-2 capitalize">
                {{ previewPokemon?.name || 'Preview' }}
              </p>
            </div>
          </div>
          <p class="text-xs text-gray-500 text-center mt-2">
            Sample using {{ spriteConfig.currentOption.name }}
            {{ spriteConfig.showShinyVariants ? '(Shiny)' : '' }}
          </p>
        </div>
      </div>

      <!-- Reset Button -->
      <div class="form-group">
        <button
          @click="resetToDefaults"
          class="btn-secondary text-sm"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useSpriteConfigStore } from '../stores/spriteConfig'
import type { Pokemon } from '../types/pokemon'

const spriteConfig = useSpriteConfigStore()

// Sample Pokemon for preview (Pikachu)
const previewPokemon = ref<Pokemon | null>(null)

const handleStyleChange = () => {
  console.log(`🎨 Style changed to: ${spriteConfig.selectedStyle}`)
  spriteConfig.saveConfig()
}

const handleShinyChange = () => {
  console.log(`✨ Shiny mode changed to: ${spriteConfig.showShinyVariants}`)
  spriteConfig.saveConfig()
}

const resetToDefaults = () => {
  spriteConfig.selectedStyle = 'official-artwork'
  spriteConfig.showShinyVariants = false
  spriteConfig.saveConfig()
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // Fallback to official artwork if current style fails
  if (previewPokemon.value) {
    const fallbackUrl = previewPokemon.value.sprites.other?.['official-artwork']?.front_default || 
                       previewPokemon.value.sprites.front_default ||
                       ''
    if (fallbackUrl) {
      img.src = fallbackUrl
    }
  }
}

// Load a sample Pokemon for preview
onMounted(async () => {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/25') // Pikachu
    if (response.ok) {
      previewPokemon.value = await response.json()
    }
  } catch (error) {
    console.warn('Failed to load preview Pokemon:', error)
  }
})
</script>

<style scoped>
.form-group {
  @apply space-y-1;
}

.sprite-preview {
  min-height: 120px;
}

.preview-card {
  transition: transform 0.2s ease;
}

.preview-card:hover {
  transform: scale(1.05);
}
</style>
