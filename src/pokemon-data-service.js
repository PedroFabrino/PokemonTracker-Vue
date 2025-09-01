import { pokemonAPI } from './pokemon-api.js'
import { GOOGLE_SHEETS_CONFIG } from './google-auth-service.js'

export class PokemonDataService {
  constructor() {
    this.pokemonData = [];
    this.allPokemonData = []; // Store all Pokemon data for binder pages
    this.collectionData = {};
    this.filteredPokemon = [];
    this.onDataChange = null; // Callback for when data changes
    this.onLoadingStatus = null; // Callback for loading status updates
  }

  // Set callback functions
  setCallbacks(onDataChange, onLoadingStatus) {
    this.onDataChange = onDataChange;
    this.onLoadingStatus = onLoadingStatus;
  }

  // Data loading methods
  async loadData(googleAuthService) {
    console.log('🔄 Starting to load Pokemon data...');
    
    if (!googleAuthService.isAuthenticated || !GOOGLE_SHEETS_CONFIG.userSpreadsheetId) {
      console.log('📱 Not authenticated or no user spreadsheet - using offline data');
      await this.loadPokemonData();
      return 'offline';
    }
    
    try {
      // Show loading state
      this.onLoadingStatus?.('Loading Pokemon data from your Google Sheets...');
      
      // Load from user's personal Google Sheets
      console.log('📊 Loading from user\'s Google Sheets...');
      await this.loadFromUserGoogleSheets();
      console.log('✅ Successfully loaded from Google Sheets!');
      return 'online';
    } catch (error) {
      console.error('❌ Failed to load from Google Sheets:', error);
      console.log('📱 Falling back to offline data...');
      await this.loadPokemonData();
      return 'offline';
    }
  }

  async loadFromUserGoogleSheets() {
    console.log('🔑 Loading from user spreadsheet...');
    console.log('Spreadsheet ID:', GOOGLE_SHEETS_CONFIG.userSpreadsheetId);
    
    if (!GOOGLE_SHEETS_CONFIG.userSpreadsheetId) {
      throw new Error('No user spreadsheet configured');
    }
    
    this.pokemonData = [];
    this.collectionData = {};
    
    // Load data from each generation sheet
    for (let i = 0; i < GOOGLE_SHEETS_CONFIG.sheets.length; i++) {
      const sheet = GOOGLE_SHEETS_CONFIG.sheets[i];
      try {
        console.log(`📋 Loading ${sheet.name}... (${i + 1}/${GOOGLE_SHEETS_CONFIG.sheets.length})`);
        this.onLoadingStatus?.(`Loading ${sheet.name}... (${i + 1}/${GOOGLE_SHEETS_CONFIG.sheets.length})`);
        await this.loadSheetDataWithOAuth(sheet);
        console.log(`✅ Successfully loaded ${sheet.name}`);
      } catch (error) {
        console.error(`❌ Failed to load ${sheet.name}:`, error);
        // Continue with other sheets even if one fails
      }
    }
    
    if (this.pokemonData.length === 0) {
      throw new Error('No Pokemon data loaded from any sheet');
    }
    
    console.log(`🎯 Total Pokemon loaded: ${this.pokemonData.length}`);
    
    // Sort Pokemon by ID for consistent display
    this.pokemonData.sort((a, b) => a.id - b.id);
    
    // Store complete Pokemon data for binder pages and autocomplete
    this.allPokemonData = [...this.pokemonData];
    
    // Notify that data has changed
    this.onDataChange?.();
    
    console.log('✅ Google Sheets data loaded and processed');
  }

  async loadSheetDataWithOAuth(sheet) {
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEETS_CONFIG.userSpreadsheetId,
        range: `'${sheet.name}'!${GOOGLE_SHEETS_CONFIG.range}`
      });
      
      console.log(`📊 Response for ${sheet.name}:`, response);
      
      if (response.result && response.result.values) {
        this.parseSheetData(response.result.values, sheet.generation);
      }
    } catch (error) {
      console.error(`❌ Error loading ${sheet.name}:`, error);
      throw error;
    }
  }

  parseSheetData(rows, generation) {
    // Skip header row (POKEDEX, POKEMON, REMAINING)
    const dataRows = rows.slice(1);
    
    dataRows.forEach((row) => {
      if (row.length >= 3) {
        const [pokedexNumber, pokemonName, remaining] = row;
        
        // Extract numeric ID from pokedex number (e.g., "#0001" -> 1)
        const id = this.extractPokedexId(pokedexNumber);
        if (!id || !pokemonName) return;
        
        // Create Pokemon object
        const pokemon = {
          id: id,
          name: pokemonName.trim(),
          generation: generation
        };
        
        this.pokemonData.push(pokemon);
        
        // Parse collection status - TRUE means you have it (collected)
        const isCollected = this.parseBooleanValue(remaining);
        if (isCollected) {
          this.collectionData[id] = true;
        }
      }
    });
  }

  extractPokedexId(pokedexString) {
    if (!pokedexString) return null;
    
    // Remove # and leading zeros, then convert to number
    const match = pokedexString.toString().match(/#?0*(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  parseBooleanValue(value) {
    if (!value) return false;
    const str = value.toString().toLowerCase().trim();
    // TRUE means you have it (collected), FALSE means you need it (missing)
    return str === 'true' || str === '1' || str === 'yes' || str === 'x';
  }

  async loadPokemonData() {
    try {
      console.log('🔄 Loading Pokemon data from PokéAPI...');
      
      // Show loading state
      this.onLoadingStatus?.('Loading Pokemon data from PokéAPI...');
      
      // Fetch data from PokéAPI
      this.pokemonData = await pokemonAPI.getPokemonForSpreadsheet();
      this.allPokemonData = [...this.pokemonData]; // Store complete Pokemon data for binder pages
      this.collectionData = this.loadCollectionData();
      
      console.log(`✅ Loaded ${this.pokemonData.length} Pokemon from PokéAPI`);
      
      // Notify that data has changed
      this.onDataChange?.();
      
    } catch (error) {
      console.error('❌ Failed to load Pokemon data from PokéAPI:', error);
      // Show error to user
      throw new Error('Failed to load Pokemon data. Please check your internet connection.');
    }
  }

  // Collection data management
  loadCollectionData() {
    const saved = localStorage.getItem('pokemon-collection');
    return saved ? JSON.parse(saved) : {};
  }

  saveCollectionData() {
    localStorage.setItem('pokemon-collection', JSON.stringify(this.collectionData));
  }

  togglePokemon(pokemonId) {
    // Toggle collection status
    if (this.collectionData[pokemonId]) {
      delete this.collectionData[pokemonId];
    } else {
      this.collectionData[pokemonId] = true;
    }
    
    // Save to localStorage
    this.saveCollectionData();
    
    // Notify that data has changed
    this.onDataChange?.();
    
    return this.collectionData[pokemonId] || false;
  }

  // Filtering methods
  applyFilters(searchQuery = '', generation = '', status = '') {
    // If Pokemon data hasn't loaded yet, don't apply filters
    if (!this.pokemonData || this.pokemonData.length === 0) {
      this.filteredPokemon = [];
      return this.filteredPokemon;
    }
    
    const searchLower = searchQuery.toLowerCase();
    
    this.filteredPokemon = this.pokemonData.filter(pokemon => {
      const matchesSearch = pokemon.name.toLowerCase().includes(searchLower) || 
                           pokemon.id.toString().includes(searchLower);
      
      const matchesGeneration = !generation || 
                               pokemon.generation.toString() === generation;
      
      const matchesStatus = !status || 
                           (status === 'collected' && this.collectionData[pokemon.id]) ||
                           (status === 'missing' && !this.collectionData[pokemon.id]);
      
      return matchesSearch && matchesGeneration && matchesStatus;
    });
    
    return this.filteredPokemon;
  }

  // Statistics
  getStats() {
    if (!this.pokemonData || this.pokemonData.length === 0) {
      return { collected: 0, total: 0 };
    }
    
    const collectedCount = Object.values(this.collectionData).filter(Boolean).length;
    const totalCount = this.pokemonData.length;
    
    return { collected: collectedCount, total: totalCount };
  }

  // Pokemon utilities
  getPokemonImage(pokemon) {
    // Use PokéAPI for standardized Pokemon images
    const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
    
    return `
      <img 
        src="${imageUrl}" 
        alt="${pokemon.name}" 
        class="pokemon-sprite"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
      />
      <div class="pokemon-emoji-fallback" style="display: none;">
        ${this.getPokemonEmojiPlaceholder(pokemon)}
      </div>
    `;
  }

  getPokemonEmojiPlaceholder(pokemon) {
    // Fallback emoji if image fails to load
    const typeEmojis = ['🌱', '🔥', '💧', '⚡', '🌸', '❄️', '👊', '☠️', '🚀', '🌙'];
    return typeEmojis[pokemon.id % typeEmojis.length];
  }

  // Search and navigation helpers
  findPokemonForAutocomplete(query) {
    if (!this.allPokemonData || this.allPokemonData.length === 0) {
      return [];
    }
    
    return this.allPokemonData.filter(pokemon => 
      pokemon.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8); // Limit to 8 results
  }

  // Binder page calculations
  getPokemonIdsInRange(startId, endId) {
    return this.filteredPokemon
      .filter(p => p.id >= startId && p.id <= endId)
      .map(p => p.id);
  }

  getBinderPagesForFiltered(pokemonPerSection = 16) {
    if (this.filteredPokemon.length === 0) {
      return [];
    }
    
    const pokemonIds = this.filteredPokemon.map(p => p.id);
    const minId = Math.min(...pokemonIds);
    const maxId = Math.max(...pokemonIds);
    
    const firstPage = Math.floor((minId - 1) / pokemonPerSection) + 1;
    const lastPage = Math.floor((maxId - 1) / pokemonPerSection) + 1;
    
    const pages = [];
    for (let page = firstPage; page <= lastPage; page++) {
      const pageStartId = (page - 1) * pokemonPerSection + 1;
      const pageEndId = page * pokemonPerSection;
      
      // Check if this page has any filtered Pokemon
      const pokemonInThisPage = this.filteredPokemon.filter(p => 
        p.id >= pageStartId && p.id <= pageEndId
      );
      
      if (pokemonInThisPage.length > 0) {
        pages.push({
          page,
          startId: pageStartId,
          endId: pageEndId,
          pokemonCount: pokemonInThisPage.length
        });
      }
    }
    
    return pages;
  }

  getPokemonById(id) {
    return this.allPokemonData.find(p => p.id === id);
  }

  isCollected(pokemonId) {
    return this.collectionData[pokemonId] || false;
  }
}
