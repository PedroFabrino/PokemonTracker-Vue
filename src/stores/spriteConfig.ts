import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Pokemon } from '../types/pokemon'

export type SpriteStyle = 
  | 'official-artwork'
  | 'home'
  | 'dream-world'
  | 'showdown'
  | 'animated-gen5'
  | 'pixel-modern'
  | 'pixel-classic'
  | 'icons'

export interface SpriteOption {
  id: SpriteStyle
  name: string
  description: string
}

export const spriteOptions: SpriteOption[] = [
  {
    id: 'official-artwork',
    name: 'Official Artwork',
    description: 'High-quality official Pokemon artwork (default)'
  },
  {
    id: 'pixel-modern',
    name: 'Modern Sprites',
    description: 'Current generation pixel art sprites'
  },
  {
    id: 'home',
    name: 'Pokemon HOME',
    description: 'Modern 3D-style sprites from Pokemon HOME'
  },
  {
    id: 'showdown',
    name: 'Pokemon Showdown',
    description: 'Animated GIF sprites from Pokemon Showdown'
  },
  {
    id: 'animated-gen5',
    name: 'Gen 5 Animated',
    description: 'Classic animated sprites from Black/White'
  },
  {
    id: 'dream-world',
    name: 'Dream World',
    description: 'Artistic Dream World style sprites (SVG)'
  },
  {
    id: 'pixel-classic',
    name: 'Retro Sprites',
    description: 'Classic pixel art from Gen 1-2'
  },
  {
    id: 'icons',
    name: 'Menu Icons',
    description: 'Small menu-style icons'
  }
]

export const useSpriteConfigStore = defineStore('spriteConfig', () => {
  const selectedStyle = ref<SpriteStyle>('official-artwork')
  const showShinyVariants = ref(false)

  // Save to localStorage
  const saveConfig = () => {
    const config = {
      selectedStyle: selectedStyle.value,
      showShinyVariants: showShinyVariants.value
    }
    
    console.log(`💾 Saving sprite config:`, config)
    
    localStorage.setItem('pokemon-sprite-config', JSON.stringify(config))
  }

  // Load from localStorage
  const loadConfig = () => {
    try {
      const saved = localStorage.getItem('pokemon-sprite-config')
      if (saved) {
        const config = JSON.parse(saved)
        selectedStyle.value = config.selectedStyle || 'official-artwork'
        showShinyVariants.value = config.showShinyVariants || false
      }
    } catch (error) {
      console.warn('Failed to load sprite config:', error)
    }
  }

  // Get the appropriate sprite URL for a Pokemon
  const getPokemonSpriteUrl = (pokemon: Pokemon): string => {
    const sprites = pokemon.sprites
    const useShiny = showShinyVariants.value

    // Helper function to get a fallback URL
    const getFallbackUrl = (): string => {
      return sprites.other?.['official-artwork']?.front_default || 
             sprites.front_default || 
             ''
    }

    try {
      let selectedUrl = ''
      
      switch (selectedStyle.value) {
        case 'official-artwork':
          if (useShiny && sprites.other?.['official-artwork']?.front_shiny) {
            selectedUrl = sprites.other['official-artwork'].front_shiny
          } else {
            selectedUrl = sprites.other?.['official-artwork']?.front_default || sprites.front_default || ''
          }
          break

        case 'home':
          if (useShiny && sprites.other?.home?.front_shiny) {
            selectedUrl = sprites.other.home.front_shiny
          } else {
            selectedUrl = sprites.other?.home?.front_default || getFallbackUrl()
          }
          break

        case 'dream-world':
          selectedUrl = sprites.other?.dream_world?.front_default || getFallbackUrl()
          break

        case 'showdown':
          if (useShiny && sprites.other?.showdown?.front_shiny) {
            selectedUrl = sprites.other.showdown.front_shiny
          } else {
            selectedUrl = sprites.other?.showdown?.front_default || getFallbackUrl()
          }
          break

        case 'animated-gen5':
          const gen5Sprites = sprites.versions?.['generation-v']?.['black-white']?.animated
          if (useShiny && gen5Sprites?.front_shiny) {
            selectedUrl = gen5Sprites.front_shiny
          } else {
            selectedUrl = gen5Sprites?.front_default || getFallbackUrl()
          }
          break

        case 'pixel-modern':
          if (useShiny && sprites.front_shiny) {
            selectedUrl = sprites.front_shiny
          } else {
            selectedUrl = sprites.front_default || ''
          }
          break

        case 'pixel-classic':
          // Try to get Gen 1 or Gen 2 sprites
          selectedUrl = sprites.versions?.['generation-i']?.['red-blue']?.front_default ||
                       sprites.versions?.['generation-ii']?.crystal?.front_default ||
                       getFallbackUrl()
          break

        case 'icons':
          selectedUrl = sprites.versions?.['generation-vii']?.icons?.front_default ||
                       sprites.versions?.['generation-viii']?.icons?.front_default ||
                       getFallbackUrl()
          break

        default:
          selectedUrl = getFallbackUrl()
      }

      // Debug logging for Pokemon ID 1 to see what's happening
      if (pokemon.id === 1) {
        console.log(`🔍 DEBUGGING Pokemon ${pokemon.name} (ID: ${pokemon.id}):`)
        console.log(`Selected Style: ${selectedStyle.value}`)
        console.log(`Shiny Mode: ${useShiny}`)
        console.log(`Selected URL: ${selectedUrl}`)
        console.log(`Available Sprites:`, {
          officialArtwork: {
            default: sprites.other?.['official-artwork']?.front_default,
            shiny: sprites.other?.['official-artwork']?.front_shiny
          },
          home: {
            default: sprites.other?.home?.front_default,
            shiny: sprites.other?.home?.front_shiny
          },
          dreamWorld: sprites.other?.dream_world?.front_default,
          showdown: {
            default: sprites.other?.showdown?.front_default,
            shiny: sprites.other?.showdown?.front_shiny
          },
          gen5Animated: {
            default: sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default,
            shiny: sprites.versions?.['generation-v']?.['black-white']?.animated?.front_shiny
          },
          frontDefault: sprites.front_default,
          frontShiny: sprites.front_shiny,
          classicGen1: sprites.versions?.['generation-i']?.['red-blue']?.front_default,
          classicGen2: sprites.versions?.['generation-ii']?.crystal?.front_default,
          icons7: sprites.versions?.['generation-vii']?.icons?.front_default,
          icons8: sprites.versions?.['generation-viii']?.icons?.front_default
        })
        console.log(`Full sprites object:`, sprites)
      }

      return selectedUrl
    } catch (error) {
      console.warn('Error getting sprite URL for Pokemon', pokemon.id, ':', error)
      return getFallbackUrl()
    }
  }

  const currentOption = computed(() => 
    spriteOptions.find(option => option.id === selectedStyle.value) || spriteOptions[0]
  )

  // Initialize
  loadConfig()

  return {
    selectedStyle,
    showShinyVariants,
    spriteOptions,
    currentOption,
    getPokemonSpriteUrl,
    saveConfig,
    loadConfig
  }
})
