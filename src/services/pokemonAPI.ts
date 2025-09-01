// Pokemon API service for fetching complete Pokemon data
export interface PokemonSpecies {
  id: number
  name: string
  generation: {
    name: string
    url: string
  }
}

export interface CompletePokemon {
  id: number
  name: string
  sprites: {
    front_default: string
  }
  types: Array<{
    type: {
      name: string
    }
  }>
  generation: number
}

class PokemonAPIService {
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

  async getAllPokemonSpecies(): Promise<PokemonSpecies[]> {
    console.log('🔍 Fetching all Pokemon species...')
    
    // Get total count first
    const initialResponse = await this.fetchWithCache(`${this.baseUrl}/pokemon-species?limit=1`)
    const totalCount = initialResponse.count
    
    console.log(`📊 Found ${totalCount} Pokemon species`)
    
    // Fetch all species
    const response = await this.fetchWithCache(`${this.baseUrl}/pokemon-species?limit=${totalCount}`)
    return response.results.map((species: any, index: number) => ({
      id: index + 1,
      name: species.name,
      url: species.url
    }))
  }

  async getPokemonDetails(pokemonId: number): Promise<CompletePokemon> {
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
      sprites: pokemonData.sprites,
      types: pokemonData.types,
      generation: generationId
    }
  }

  async getAllPokemonByGeneration(): Promise<Map<number, CompletePokemon[]>> {
    const allSpecies = await this.getAllPokemonSpecies()
    const pokemonByGeneration = new Map<number, CompletePokemon[]>()
    
    console.log(`🔄 Fetching details for ${allSpecies.length} Pokemon...`)
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 50
    for (let i = 0; i < allSpecies.length; i += batchSize) {
      const batch = allSpecies.slice(i, i + batchSize)
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allSpecies.length / batchSize)}`)
      
      const pokemonDetails = await Promise.all(
        batch.map(species => this.getPokemonDetails(species.id))
      )

      // Group by generation
      pokemonDetails.forEach(pokemon => {
        if (!pokemonByGeneration.has(pokemon.generation)) {
          pokemonByGeneration.set(pokemon.generation, [])
        }
        pokemonByGeneration.get(pokemon.generation)!.push(pokemon)
      })

      // Small delay between batches to be respectful to the API
      if (i + batchSize < allSpecies.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log('✅ All Pokemon data fetched successfully')
    return pokemonByGeneration
  }

  formatPokemonName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  formatPokedexNumber(id: number): string {
    return `#${id.toString().padStart(4, '0')}`
  }
}

export const pokemonAPI = new PokemonAPIService()
