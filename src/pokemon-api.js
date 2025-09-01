// PokéAPI integration service
// Free Pokemon API with comprehensive data for all generations

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

/**
 * Pokemon API service for fetching data from PokéAPI
 */
export class PokemonAPI {
  constructor() {
    this.cache = new Map(); // Simple in-memory cache to avoid repeated API calls
  }

  /**
   * Fetch data from PokéAPI with caching
   */
  async fetchWithCache(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.cache.set(url, data);
      return data;
    } catch (error) {
      console.error('Error fetching from PokéAPI:', error);
      throw error;
    }
  }

  /**
   * Get all Pokemon species with pagination
   * Returns: { results: [{name, url}], count, next, previous }
   */
  async getAllPokemonSpecies(limit = 1500, offset = 0) {
    const url = `${POKEAPI_BASE_URL}/pokemon-species?limit=${limit}&offset=${offset}`;
    return await this.fetchWithCache(url);
  }

  /**
   * Get Pokemon species details by ID or name
   */
  async getPokemonSpecies(idOrName) {
    const url = `${POKEAPI_BASE_URL}/pokemon-species/${idOrName}`;
    return await this.fetchWithCache(url);
  }

  /**
   * Get Pokemon details by ID or name
   */
  async getPokemon(idOrName) {
    const url = `${POKEAPI_BASE_URL}/pokemon/${idOrName}`;
    return await this.fetchWithCache(url);
  }

  /**
   * Get generation details
   */
  async getGeneration(idOrName) {
    const url = `${POKEAPI_BASE_URL}/generation/${idOrName}`;
    return await this.fetchWithCache(url);
  }

  /**
   * Get all generations
   */
  async getAllGenerations() {
    const url = `${POKEAPI_BASE_URL}/generation`;
    return await this.fetchWithCache(url);
  }

  /**
   * Convert PokéAPI Pokemon species to our simplified format
   */
  formatPokemonForSheet(species, pokemon = null) {
    // Extract Pokemon ID from URL if not provided directly
    const id = species.id || this.extractIdFromUrl(species.url);
    
    // Get generation number
    const generation = this.extractIdFromUrl(species.generation?.url) || 1;

    return {
      id: id,
      name: this.capitalize(species.name),
      generation: generation,
      owned: false // Default to not owned
    };
  }

  /**
   * Extract ID from PokéAPI URL
   */
  extractIdFromUrl(url) {
    if (!url) return null;
    const matches = url.match(/\/(\d+)\/$/);
    return matches ? parseInt(matches[1]) : null;
  }

  /**
   * Capitalize Pokemon name
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Get Pokemon data for spreadsheet generation (optimized)
   * This fetches all Pokemon species efficiently and formats them for our tracker
   */
  async getPokemonForSpreadsheet() {
    try {
      console.log('Fetching Pokemon data from PokéAPI...');
      
      // Get all Pokemon species in one request (this is much faster)
      const speciesData = await this.getAllPokemonSpecies();
      console.log(`Found ${speciesData.count} Pokemon species`);

      // Format the data for our spreadsheet using just the species list
      const pokemonList = [];
      
      // Process each species - we can get most info from the species list itself
      for (const species of speciesData.results) {
        const id = this.extractIdFromUrl(species.url);
        if (id && id <= 1025) { // Only include Pokemon up to current generation
          pokemonList.push({
            id: id,
            name: this.capitalize(species.name),
            generation: this.getGenerationFromId(id),
            owned: false // Default to not owned
          });
        }
      }

      // Sort by ID to maintain Pokedex order
      pokemonList.sort((a, b) => a.id - b.id);
      
      console.log(`Processed ${pokemonList.length} Pokemon for spreadsheet`);
      return pokemonList;
      
    } catch (error) {
      console.error('Error getting Pokemon data for spreadsheet:', error);
      throw new Error('Failed to fetch Pokemon data from PokéAPI');
    }
  }

  /**
   * Determine generation from Pokemon ID (faster than API calls)
   */
  getGenerationFromId(id) {
    if (id >= 1 && id <= 151) return 1;
    if (id >= 152 && id <= 251) return 2;
    if (id >= 252 && id <= 386) return 3;
    if (id >= 387 && id <= 493) return 4;
    if (id >= 494 && id <= 649) return 5;
    if (id >= 650 && id <= 721) return 6;
    if (id >= 722 && id <= 809) return 7;
    if (id >= 810 && id <= 905) return 8;
    if (id >= 906 && id <= 1025) return 9;
    return 1; // Default to generation 1
  }

  /**
   * Get Pokemon data by generation (optimized)
   */
  async getPokemonByGeneration(generationId) {
    try {
      // Use our optimized method and filter by generation
      const allPokemon = await this.getPokemonForSpreadsheet();
      return allPokemon.filter(pokemon => pokemon.generation === generationId);
    } catch (error) {
      console.error(`Error getting Pokemon for generation ${generationId}:`, error);
      throw error;
    }
  }

  /**
   * Search Pokemon by name
   */
  async searchPokemon(searchTerm) {
    try {
      const pokemon = await this.getPokemon(searchTerm.toLowerCase());
      const species = await this.getPokemonSpecies(pokemon.species.name);
      return this.formatPokemonForSheet(species, pokemon);
    } catch (error) {
      console.error(`Pokemon '${searchTerm}' not found:`, error);
      return null;
    }
  }
}

// Export a singleton instance
export const pokemonAPI = new PokemonAPI();
