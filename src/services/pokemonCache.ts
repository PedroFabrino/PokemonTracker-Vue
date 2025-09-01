// Pokemon cache service using localStorage
import type { Pokemon } from '../types/pokemon'

interface PokemonCache {
  data: Pokemon[]
  timestamp: number
  version: string
}

class PokemonCacheService {
  private readonly CACHE_KEY = 'pokemon-tracker-cache'
  private readonly CACHE_VERSION = '1.1.0' // Updated to force cache refresh for complete sprite data
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

  // Save Pokemon data to localStorage
  saveToCache(pokemon: Pokemon[]): void {
    try {
      const cacheData: PokemonCache = {
        data: pokemon,
        timestamp: Date.now(),
        version: this.CACHE_VERSION
      }
      
      const jsonString = JSON.stringify(cacheData)
      localStorage.setItem(this.CACHE_KEY, jsonString)
      
      console.log(`✅ Cached ${pokemon.length} Pokemon to localStorage`)
    } catch (error) {
      console.warn('Failed to save Pokemon cache:', error)
    }
  }

  // Load Pokemon data from localStorage
  loadFromCache(): Pokemon[] | null {
    try {
      const cachedString = localStorage.getItem(this.CACHE_KEY)
      if (!cachedString) {
        console.log('No Pokemon cache found')
        return null
      }

      const cached: PokemonCache = JSON.parse(cachedString)
      
      // Check cache version
      if (cached.version !== this.CACHE_VERSION) {
        console.log('Cache version mismatch, invalidating cache')
        this.clearCache()
        return null
      }

      // Check cache age
      const age = Date.now() - cached.timestamp
      if (age > this.CACHE_DURATION) {
        console.log('Cache expired, invalidating cache')
        this.clearCache()
        return null
      }

      console.log(`✅ Loaded ${cached.data.length} Pokemon from cache (${Math.round(age / (1000 * 60 * 60))} hours old)`)
      return cached.data
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
  getCacheInfo(): { exists: boolean; age?: number; count?: number } {
    try {
      const cachedString = localStorage.getItem(this.CACHE_KEY)
      if (!cachedString) return { exists: false }

      const cached: PokemonCache = JSON.parse(cachedString)
      const age = Date.now() - cached.timestamp
      
      return {
        exists: true,
        age: Math.round(age / (1000 * 60 * 60)), // hours
        count: cached.data.length
      }
    } catch {
      return { exists: false }
    }
  }
}

export const pokemonCache = new PokemonCacheService()
