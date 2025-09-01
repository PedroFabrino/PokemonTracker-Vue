// Web Worker for loading Pokemon data in the background
class PokemonWorker {
  constructor() {
    this.baseUrl = 'https://pokeapi.co/api/v2'
    this.cache = new Map()
  }

  async fetchWithCache(url) {
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

  async getAllPokemonSpecies() {
    // Get total count first
    const initialResponse = await this.fetchWithCache(`${this.baseUrl}/pokemon-species?limit=1`)
    const totalCount = initialResponse.count
    
    // Fetch all species
    const response = await this.fetchWithCache(`${this.baseUrl}/pokemon-species?limit=${totalCount}`)
    return response.results.map((species, index) => ({
      id: index + 1,
      name: species.name,
      url: species.url
    }))
  }

  async getPokemonDetails(pokemonId) {
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
      },
      generation: generationId
    }
  }

  async loadAllPokemon() {
    try {
      const allSpecies = await this.getAllPokemonSpecies()
      
      // Send progress update
      self.postMessage({
        type: 'progress',
        data: {
          message: `Found ${allSpecies.length} Pokemon. Starting to load details...`,
          progress: 0,
          total: allSpecies.length
        }
      })

      const allPokemon = []
      
      // Use larger batch size since we're in a worker and can be more aggressive
      const batchSize = 100
      
      for (let i = 0; i < allSpecies.length; i += batchSize) {
        const batch = allSpecies.slice(i, i + batchSize)
        
        // Send progress update
        self.postMessage({
          type: 'progress',
          data: {
            message: `Loading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allSpecies.length / batchSize)}...`,
            progress: i,
            total: allSpecies.length
          }
        })
        
        const pokemonDetails = await Promise.all(
          batch.map(species => this.getPokemonDetails(species.id))
        )

        allPokemon.push(...pokemonDetails)

        // Send partial data to update UI progressively
        self.postMessage({
          type: 'partial_data',
          data: {
            pokemon: pokemonDetails,
            progress: i + batch.length,
            total: allSpecies.length
          }
        })

        // Smaller delay since we're in a worker
        if (i + batchSize < allSpecies.length) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      // Send final complete data
      self.postMessage({
        type: 'complete',
        data: {
          pokemon: allPokemon,
          message: 'All Pokemon loaded successfully!'
        }
      })

    } catch (error) {
      self.postMessage({
        type: 'error',
        data: {
          message: error.message,
          error: error
        }
      })
    }
  }
}

const worker = new PokemonWorker()

self.onmessage = function(e) {
  const { type } = e.data
  
  switch (type) {
    case 'load_all_pokemon':
      worker.loadAllPokemon()
      break
    default:
      console.warn('Unknown message type:', type)
  }
}
