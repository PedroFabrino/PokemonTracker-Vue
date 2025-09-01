// Non-blocking Pokemon API service using requestIdleCallback
import type { Pokemon } from '../types/pokemon'

export interface PokemonLoadProgress {
  message: string
  progress: number
  total: number
}

class NonBlockingPokemonAPI {
  private baseUrl = 'https://pokeapi.co/api/v2'
  private cache: Map<string, any> = new Map()

  async fetchWithCache(url: string): Promise<any> {
    if (this.cache.has(url)) {
      return this.cache.get(url)
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
    }

    const data = await response.json()
    this.cache.set(url, data)
    return data
  }

  // Yield control back to browser to prevent UI blocking
  private async yieldToBrowser(): Promise<void> {
    return new Promise(resolve => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => resolve(), { timeout: 50 })
      } else {
        setTimeout(resolve, 10)
      }
    })
  }

  async getAllPokemonSpecies(): Promise<any[]> {
    // Get total count first
    const initialResponse = await this.fetchWithCache(`${this.baseUrl}/pokemon-species?limit=1`)
    const totalCount = initialResponse.count
    
    // Fetch all species
    const response = await this.fetchWithCache(`${this.baseUrl}/pokemon-species?limit=${totalCount}`)
    return response.results.map((species: any, index: number) => ({
      id: index + 1,
      name: species.name,
      url: species.url
    }))
  }

  async getPokemonDetails(pokemonId: number): Promise<Pokemon> {
    const [pokemonData, speciesData] = await Promise.all([
      this.fetchWithCache(`${this.baseUrl}/pokemon/${pokemonId}`),
      this.fetchWithCache(`${this.baseUrl}/pokemon-species/${pokemonId}`)
    ])

    // Extract generation number from URL
    const generationUrl = speciesData.generation.url
    const generationId = parseInt(generationUrl.split('/').slice(-2, -1)[0])

    return {
      id: pokemonData.id,
      name: pokemonData.name,
      sprites: {
        front_default: pokemonData.sprites.front_default,
        other: {
          'official-artwork': {
            front_default: pokemonData.sprites.other?.['official-artwork']?.front_default || pokemonData.sprites.front_default
          }
        }
      },
      types: pokemonData.types,
      height: pokemonData.height,
      weight: pokemonData.weight,
      base_experience: pokemonData.base_experience,
      abilities: pokemonData.abilities,
      stats: pokemonData.stats,
      species: {
        name: pokemonData.name,
        url: `https://pokeapi.co/api/v2/pokemon-species/${pokemonData.id}/`
      }
    }
  }

  async loadAllPokemonNonBlocking(
    onProgress?: (progress: PokemonLoadProgress) => void,
    onPartialData?: (pokemon: Pokemon[]) => void,
    onComplete?: (pokemon: Pokemon[]) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      console.log('🎯 Starting non-blocking Pokemon loading...')
      
      const allSpecies = await this.getAllPokemonSpecies()
      
      onProgress?.({
        message: `Found ${allSpecies.length} Pokemon. Starting to load details...`,
        progress: 0,
        total: allSpecies.length
      })

      const allPokemon: Pokemon[] = []
      
      // Larger batch size for faster downloading, but smaller render batches
      const batchSize = 50 // Good balance between speed and responsiveness
      const delayBetweenBatches = 50 // Shorter delay since we're using larger batches
      
      for (let i = 0; i < allSpecies.length; i += batchSize) {
        const batch = allSpecies.slice(i, i + batchSize)
        
        onProgress?.({
          message: `Loading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allSpecies.length / batchSize)}...`,
          progress: i,
          total: allSpecies.length
        })
        
        // Process entire batch in parallel for speed
        const batchPokemon = await Promise.all(
          batch.map(async (species) => {
            try {
              return await this.getPokemonDetails(species.id)
            } catch (error) {
              console.warn(`Failed to load Pokemon #${species.id}:`, error)
              return null
            }
          })
        )

        // Filter out failed requests
        const validPokemon = batchPokemon.filter(pokemon => pokemon !== null) as Pokemon[]
        allPokemon.push(...validPokemon)

        // Send partial data for UI updates
        if (validPokemon.length > 0) {
          onPartialData?.(validPokemon)
        }

        // Yield between batches
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }

      // Sort by ID and send final data
      allPokemon.sort((a, b) => a.id - b.id)
      onComplete?.(allPokemon)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      onError?.(errorMessage)
    }
  }
}

export const nonBlockingPokemonAPI = new NonBlockingPokemonAPI()
