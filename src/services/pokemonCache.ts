// Pokemon cache service using localStorage
import type { Pokemon } from '../types/pokemon'

interface PokemonCache {
  data: CompactPokemon[]
  timestamp: number
  version: string
}

// Compact Pokemon format for caching (only essential data)
interface CompactPokemon {
  id: number
  name: string
  sprites: {
    front_default: string
    front_shiny?: string | null
    dream_world?: string | null
    official_artwork?: string | null
    home?: string | null
  }
  types: string[]
  generation: number
}

class PokemonCacheService {
  private readonly CACHE_KEY = 'pokemon-tracker-cache'
  private readonly CACHE_VERSION = '1.2.0' // Updated for compact cache format
  private readonly CACHE_DURATION = 365 * 24 * 60 * 60 * 1000 // 1 year in milliseconds (longest practical duration)

  // Convert full Pokemon to compact format for caching
  private compressPokemon(pokemon: Pokemon[]): CompactPokemon[] {
    return pokemon.map(p => ({
      id: p.id,
      name: p.name,
      sprites: {
        front_default: p.sprites.front_default,
        front_shiny: p.sprites.front_shiny,
        dream_world: p.sprites.other?.dream_world?.front_default,
        official_artwork: p.sprites.other?.['official-artwork']?.front_default,
        home: p.sprites.other?.home?.front_default
      },
      types: p.types?.map(t => t.type.name) || [],
      generation: this.getGenerationFromId(p.id)
    }))
  }

  // Convert compact Pokemon back to full format
  private expandPokemon(compactPokemon: CompactPokemon[]): Pokemon[] {
    return compactPokemon.map(cp => ({
      id: cp.id,
      name: cp.name,
      sprites: {
        front_default: cp.sprites.front_default,
        front_shiny: cp.sprites.front_shiny,
        back_default: null,
        back_shiny: null,
        front_female: null,
        back_female: null,
        front_shiny_female: null,
        back_shiny_female: null,
        other: {
          'official-artwork': {
            front_default: cp.sprites.official_artwork || undefined,
            front_shiny: null
          },
          home: {
            front_default: cp.sprites.home || undefined,
            front_female: null,
            front_shiny: null,
            front_shiny_female: null
          },
          dream_world: {
            front_default: cp.sprites.dream_world || undefined,
            front_female: null
          }
        }
      },
      types: cp.types.map(name => ({ type: { name } })),
      height: 0,
      weight: 0,
      base_experience: 0,
      abilities: [],
      stats: [],
      species: { name: cp.name, url: '' }
    }))
  }

  // Determine generation from Pokemon ID
  private getGenerationFromId(id: number): number {
    if (id <= 151) return 1
    if (id <= 251) return 2
    if (id <= 386) return 3
    if (id <= 493) return 4
    if (id <= 649) return 5
    if (id <= 721) return 6
    if (id <= 809) return 7
    if (id <= 905) return 8
    return 9
  }

  // Save Pokemon data to localStorage
  saveToCache(pokemon: Pokemon[]): void {
    console.log(`🔄 Attempting to cache ${pokemon.length} Pokemon to localStorage...`)
    
    // Check storage before saving
    const storageInfo = this.getStorageInfo()
    console.log(`💾 Current localStorage usage: ${storageInfo.usedMB}MB`)
    
    try {
      // Compress Pokemon data for storage
      const compactData = this.compressPokemon(pokemon)
      
      const cacheData: PokemonCache = {
        data: compactData,
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
      }

      const jsonString = JSON.stringify(cacheData)
      const sizeInMB = (jsonString.length / (1024 * 1024)).toFixed(2)
      
      console.log(`📦 Compressed cache data size: ${sizeInMB}MB`)
      
      localStorage.setItem(this.CACHE_KEY, jsonString)

      console.log(`✅ Successfully cached ${pokemon.length} Pokemon to localStorage`)
      console.log(`📦 Cache expires in 1 year`)
    } catch (error) {
      console.error('❌ Failed to save Pokemon cache:', error)
      
      // Check if it's a storage quota issue
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('💾 LocalStorage quota exceeded! Cache too large.')
        console.error('🔧 Consider reducing data size or using IndexedDB for large datasets')
      }
    }
  }  // Load Pokemon data from localStorage
  loadFromCache(): Pokemon[] | null {
    try {
      const cachedString = localStorage.getItem(this.CACHE_KEY)
      if (!cachedString) {
        console.log('📭 No Pokemon cache found in localStorage')
        return null
      }

      const cached: PokemonCache = JSON.parse(cachedString)

      // Check cache version
      if (cached.version !== this.CACHE_VERSION) {
        console.log(
          `🔄 Cache version mismatch (found: ${cached.version}, expected: ${this.CACHE_VERSION}), invalidating cache`,
        )
        this.clearCache()
        return null
      }

      // Check cache age
      const age = Date.now() - cached.timestamp
      if (age > this.CACHE_DURATION) {
        console.log(
          `⏰ Cache expired (${Math.round(age / (1000 * 60 * 60 * 24))} days old), invalidating cache`,
        )
        this.clearCache()
        return null
      }

      console.log(
        `✅ Loaded ${cached.data.length} Pokemon from cache (${Math.round(age / (1000 * 60 * 60 * 24))} days old)`,
      )
      
      // Expand compact data back to full Pokemon format
      return this.expandPokemon(cached.data)
    } catch (error) {
      console.warn('Failed to load Pokemon cache:', error)
      this.clearCache()
      return null
    }
  }

  // Check if cache is available and valid
  isCacheValid(): boolean {
    try {
      const cachedString = localStorage.getItem(this.CACHE_KEY)
      if (!cachedString) return false

      const cached: PokemonCache = JSON.parse(cachedString)

      // Check version and age
      const age = Date.now() - cached.timestamp
      return cached.version === this.CACHE_VERSION && age <= this.CACHE_DURATION
    } catch {
      return false
    }
  }

  // Clear cache
  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY)
    console.log('Pokemon cache cleared')
  }

  // Get cache info
  getCacheInfo(): {
    exists: boolean
    age?: number
    ageDays?: number
    count?: number
    version?: string
    isValid?: boolean
  } {
    try {
      const cachedString = localStorage.getItem(this.CACHE_KEY)
      if (!cachedString) return { exists: false }

      const cached: PokemonCache = JSON.parse(cachedString)
      const age = Date.now() - cached.timestamp
      const ageHours = Math.round(age / (1000 * 60 * 60))
      const ageDays = Math.round(age / (1000 * 60 * 60 * 24))
      const isValid = cached.version === this.CACHE_VERSION && age <= this.CACHE_DURATION

      return {
        exists: true,
        age: ageHours, // hours for backward compatibility
        ageDays: ageDays,
        count: cached.data.length,
        version: cached.version,
        isValid: isValid,
      }
    } catch {
      return { exists: false }
    }
  }

  // Check localStorage usage
  getStorageInfo(): { used: number; remaining: number; usedMB: string; total: number } {
    let used = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length
      }
    }

    // Most browsers allow ~5-10MB in localStorage
    const estimated = 5 * 1024 * 1024 // 5MB estimate
    const remaining = Math.max(0, estimated - used)
    const usedMB = (used / (1024 * 1024)).toFixed(2)

    return {
      used,
      remaining,
      usedMB,
      total: estimated,
    }
  }
}

export const pokemonCache = new PokemonCacheService()
