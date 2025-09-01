// Google Sheets configuration
export const GOOGLE_SHEETS_CONFIG = {
  // User's personal spreadsheet (will be created automatically)
  userSpreadsheetId: null,
  clientId: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID,
  sheetTitle: 'Pokemon Collection Tracker', // Name for user's personal sheet
  sheets: [
    { name: 'GEN 1', generation: 1 },
    { name: 'GEN 2', generation: 2 },
    { name: 'GEN 3', generation: 3 },
    { name: 'GEN 4', generation: 4 },
    { name: 'GEN 5', generation: 5 },
    { name: 'GEN 6', generation: 6 },
    { name: 'GEN 7', generation: 7 },
    { name: 'GEN 8', generation: 8 },
    { name: 'GEN 9', generation: 9 }
  ],
  range: 'A:C', // POKEDEX, POKEMON, REMAINING columns
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ]
};

export class GoogleAuthService {
  constructor() {
    this.isAuthenticated = false;
    this.gapi = null;
    this.accessToken = null;
    this.userCredential = null;
    this.onAuthStateChange = null; // Callback for auth state changes
    this.onSyncStatus = null; // Callback for sync status updates
  }

  // Set callback functions
  setCallbacks(onAuthStateChange, onSyncStatus) {
    this.onAuthStateChange = onAuthStateChange;
    this.onSyncStatus = onSyncStatus;
  }

  async initializeGoogleIdentity() {
    try {
      console.log('🔑 Initializing Google Identity Services...');
      
      if (!GOOGLE_SHEETS_CONFIG.clientId) {
        console.log('⚠️ No Google OAuth Client ID configured');
        this.onAuthStateChange?.('unauthenticated');
        return;
      }

      // Initialize Google Identity Services
      google.accounts.id.initialize({
        client_id: GOOGLE_SHEETS_CONFIG.clientId,
        callback: (response) => this.handleCredentialResponse(response),
        auto_select: false,
        cancel_on_tap_outside: false
      });

      console.log('✅ Google Identity Services initialized');

      // Initialize the Google API client for Sheets access
      console.log('🔄 Loading Google API client...');
      await this.loadGoogleAPI();
      console.log('✅ Google API client loaded');

      gapi.load('client', async () => {
        console.log('🔧 Initializing gapi client...');
        await gapi.client.init({
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
        });
        this.gapi = gapi;
        console.log('✅ gapi client initialized');

        // Now that gapi is ready, check for saved authentication state
        const savedAuth = this.loadAuthenticationState();
        if (savedAuth) {
          console.log('📦 Found saved authentication, attempting restore...');
          const restored = await this.restoreAuthenticationState(savedAuth);
          if (restored) {
            console.log('✅ Authentication restored from saved state');
            return;
          }
        }

        this.onAuthStateChange?.('unauthenticated');
      });

    } catch (error) {
      console.error('❌ Failed to initialize Google services:', error);
      this.onAuthStateChange?.('error', error.message);
    }
  }

  async handleCredentialResponse(response) {
    try {
      console.log('🔑 Received credential response from Google');
      
      // Decode the JWT credential to get user info
      const credential = this.parseJwtCredential(response.credential);
      console.log('👤 User signed in:', credential.name, credential.email);
      
      this.userCredential = credential;
      
      // Now request OAuth2 permissions for Google Sheets access
      console.log('🔐 Requesting Google Sheets permissions...');
      
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_SHEETS_CONFIG.clientId,
        scope: GOOGLE_SHEETS_CONFIG.scopes.join(' '),
        callback: (tokenResponse) => {
          console.log('🎫 Received access token:', !!tokenResponse.access_token);
          this.accessToken = tokenResponse.access_token;
          this.isAuthenticated = true;
          
          // Save authentication state
          this.saveAuthenticationState({
            accessToken: this.accessToken,
            userCredential: this.userCredential
          });

          // Update UI to show authenticated status
          this.onAuthStateChange?.('authenticated', credential.name);
          
          // Set up user's spreadsheet
          this.setupUserSpreadsheet();
        }
      });
      
      // Request the token (this will show OAuth consent if needed)
      tokenClient.requestAccessToken({ prompt: 'consent' });
      
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      
      if (error.message.includes('popup')) {
        this.onAuthStateChange?.('error', 'Popup blocked. Please allow popups for this site and try again.');
      } else {
        this.onAuthStateChange?.('error', 'Authentication failed: ' + error.message);
      }
    }
  }

  parseJwtCredential(credential) {
    const parts = credential.split('.');
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };
  }

  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (typeof gapi !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  async signOut() {
    try {
      console.log('🚪 Signing out...');
      
      // Sign out from Google Identity Services
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
      }
      
      // Clear authentication state
      this.isAuthenticated = false;
      this.accessToken = null;
      this.userCredential = null;
      
      // Clear saved authentication state
      this.clearAuthenticationState();
      
      // Clear gapi token
      if (this.gapi && this.gapi.client) {
        this.gapi.client.setToken(null);
      }
      
      console.log('✅ Signed out successfully');
      
      // Clear user spreadsheet info
      GOOGLE_SHEETS_CONFIG.userSpreadsheetId = null;
      localStorage.removeItem('pokemon-user-spreadsheet-id');
      
      this.onAuthStateChange?.('unauthenticated');
      
    } catch (error) {
      console.error('❌ Sign out failed:', error);
    }
  }

  renderSignInButton() {
    if (typeof google !== 'undefined' && google.accounts) {
      const googleSigninButton = document.getElementById('google-signin-button');
      if (googleSigninButton) {
        google.accounts.id.renderButton(googleSigninButton, {
          theme: 'outline',
          size: 'large',
          width: 250
        });
      }
    } else {
      console.log('⚠️ Google Identity Services not available for button rendering');
    }
  }

  async setupUserSpreadsheet() {
    try {
      console.log('📋 Setting up user spreadsheet...');
      this.onSyncStatus?.('Setting up your personal Pokemon tracker...');
      
      // Check if user already has a spreadsheet saved
      const savedSpreadsheetId = localStorage.getItem('pokemon-user-spreadsheet-id');
      if (savedSpreadsheetId) {
        console.log('📄 Found saved spreadsheet ID:', savedSpreadsheetId);
        const hasAccess = await this.verifySpreadsheetAccess(savedSpreadsheetId);
        if (hasAccess) {
          console.log('✅ User has access to saved spreadsheet');
          GOOGLE_SHEETS_CONFIG.userSpreadsheetId = savedSpreadsheetId;
          this.onSyncStatus?.('✅ Connected to your Pokemon tracker!');
          setTimeout(() => this.onSyncStatus?.(null), 3000);
          return;
        } else {
          console.log('❌ User lost access to saved spreadsheet, will create new one');
          localStorage.removeItem('pokemon-user-spreadsheet-id');
        }
      } else {
        console.log('🔍 No saved spreadsheet found, checking Drive...');
        const existingSheet = await this.findUserPokemonSheet();
        if (existingSheet) {
          console.log('📄 Found existing sheet in Drive:', existingSheet.id);
          GOOGLE_SHEETS_CONFIG.userSpreadsheetId = existingSheet.id;
          localStorage.setItem('pokemon-user-spreadsheet-id', existingSheet.id);
          this.onSyncStatus?.('✅ Connected to existing Pokemon tracker!');
          setTimeout(() => this.onSyncStatus?.(null), 3000);
          return;
        }
      }
      
      // Ask user if they want to import existing data
      console.log('❓ Asking user about data import...');
      const importExisting = await this.askForDataImport();
      console.log('👤 User import choice:', importExisting);
      
      if (importExisting.import && importExisting.spreadsheetId) {
        console.log('📥 Creating new spreadsheet with imported data...');
        const newSpreadsheetId = await this.createUserPokemonSheetWithImport(importExisting.spreadsheetId);
        GOOGLE_SHEETS_CONFIG.userSpreadsheetId = newSpreadsheetId;
        localStorage.setItem('pokemon-user-spreadsheet-id', newSpreadsheetId);
        this.onSyncStatus?.('✅ Pokemon tracker created with imported data!');
      } else {
        console.log('🆕 Creating fresh Pokemon tracker spreadsheet...');
        const newSpreadsheetId = await this.createUserPokemonSheet();
        GOOGLE_SHEETS_CONFIG.userSpreadsheetId = newSpreadsheetId;
        localStorage.setItem('pokemon-user-spreadsheet-id', newSpreadsheetId);
        this.onSyncStatus?.('✅ New Pokemon tracker created!');
      }
      
      setTimeout(() => this.onSyncStatus?.(null), 3000);
      
    } catch (error) {
      console.error('❌ Failed to setup user spreadsheet:', error);
      this.onSyncStatus?.('❌ Failed to setup personal tracker');
      setTimeout(() => this.onSyncStatus?.(null), 3000);
    }
  }

  async verifySpreadsheetAccess(spreadsheetId) {
    try {
      const response = await gapi.client.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId
      });
      return response.status === 200;
    } catch (error) {
      console.log('Spreadsheet verification failed:', error);
      return false;
    }
  }

  async findUserPokemonSheet() {
    try {
      console.log('🔍 Searching Google Drive for existing Pokemon Collection Tracker...');
      
      // Search for existing Pokemon Collection Tracker in user's Google Drive
      const response = await gapi.client.request({
        path: 'https://www.googleapis.com/drive/v3/files',
        params: {
          q: `name='${GOOGLE_SHEETS_CONFIG.sheetTitle}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
          spaces: 'drive'
        }
      });
      
      console.log('📊 Drive search response:', response);
      console.log('📊 Files found:', response.result.files?.length || 0);
      
      if (response.result.files && response.result.files.length > 0) {
        console.log('✅ Found existing Pokemon tracker(s):', response.result.files);
        return response.result.files[0]; // Return the first match
      }
      
      console.log('🚫 No existing Pokemon tracker found in Drive');
      return null;
    } catch (error) {
      console.error('❌ Error searching for existing sheet:', error);
      return null;
    }
  }

  async createUserPokemonSheet() {
    try {
      console.log('🆕 Creating new spreadsheet...');
      
      // Import Pokemon API for data
      const { pokemonAPI } = await import('./pokemon-api.js');
      
      // Create new spreadsheet
      const createResponse = await gapi.client.sheets.spreadsheets.create({
        resource: {
          properties: {
            title: GOOGLE_SHEETS_CONFIG.sheetTitle
          },
          sheets: GOOGLE_SHEETS_CONFIG.sheets.map(sheet => ({
            properties: {
              title: sheet.name
            }
          }))
        }
      });
      
      const spreadsheetId = createResponse.result.spreadsheetId;
      console.log('📄 Created new spreadsheet with ID:', spreadsheetId);
      
      // Populate each generation sheet with Pokemon data
      console.log('📝 Starting to populate generation sheets...');
      for (const sheet of GOOGLE_SHEETS_CONFIG.sheets) {
        console.log(`📝 Populating ${sheet.name} (Generation ${sheet.generation})...`);
        await this.populateGenerationSheet(spreadsheetId, sheet);
      }
      console.log('✅ All generation sheets populated');
      
      // Delete the default "Sheet1" that gets created automatically
      console.log('🗑️ Cleaning up default Sheet1...');
      await this.deleteDefaultSheet(spreadsheetId);
      console.log('✅ Default sheet cleanup completed');
      
      console.log('🎉 New Pokemon tracker spreadsheet fully created and configured');
      return spreadsheetId;
      
    } catch (error) {
      console.error('❌ Error creating user spreadsheet:', error);
      throw error;
    }
  }

  async populateGenerationSheet(spreadsheetId, sheet) {
    try {
      // Import Pokemon API for data
      const { pokemonAPI } = await import('./pokemon-api.js');
      
      // Get Pokemon for this generation from PokéAPI
      const generationPokemon = await pokemonAPI.getPokemonByGeneration(sheet.generation);
      
      // Prepare data with headers
      const values = [['POKEDEX', 'POKEMON', 'REMAINING']]; // Header row
      
      // Add Pokemon data
      generationPokemon.forEach(pokemon => {
        const pokedexNumber = `#${pokemon.id.toString().padStart(4, '0')}`;
        values.push([
          pokedexNumber,
          pokemon.name,
          'FALSE'        ]);
      });
      
      // Update the sheet
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: `'${sheet.name}'!A:C`,
        valueInputOption: 'RAW',
        resource: { values }
      });
      
      console.log(`✅ Populated ${sheet.name} with ${generationPokemon.length} Pokemon`);
      
    } catch (error) {
      console.error(`Error populating ${sheet.name}:`, error);
    }
  }

  async deleteDefaultSheet(spreadsheetId) {
    try {
      // Get spreadsheet info to find Sheet1
      const response = await gapi.client.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId
      });
      
      // Find Sheet1 (the default sheet)
      const defaultSheet = response.result.sheets.find(s => s.properties.title === 'Sheet1');
      if (defaultSheet) {
        await gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: spreadsheetId,
          resource: {
            requests: [{
              deleteSheet: {
                sheetId: defaultSheet.properties.sheetId
              }
            }]
          }
        });
        console.log('🗑️ Deleted default Sheet1');
      }
    } catch (error) {
      console.log('Could not delete default sheet (this is usually fine):', error);
    }
  }

  async askForDataImport() {
    return new Promise((resolve) => {
      // Create modal dialog
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        font-family: inherit;
      `;
      
      modal.innerHTML = `
        <div style="
          background: white;
          padding: 2rem;
          border-radius: 12px;
          max-width: 500px;
          margin: 1rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        ">
          <h2 style="margin: 0 0 1rem 0; color: #1e293b;">Import Existing Collection?</h2>
          <p style="margin: 0 0 1.5rem 0; color: #64748b; line-height: 1.5;">
            Do you have an existing Pokemon collection spreadsheet you'd like to import? 
            This will copy your current progress into a new tracker.
          </p>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
              Existing Spreadsheet URL (optional):
            </label>
            <input 
              type="text" 
              id="import-url" 
              placeholder="https://docs.google.com/spreadsheets/d/..." 
              style="
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                font-size: 1rem;
                box-sizing: border-box;
              "
            />
            <small style="color: #64748b; margin-top: 0.25rem; display: block;">
              Paste the URL of your existing Google Sheets Pokemon collection
            </small>
          </div>
          
          <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button 
              id="skip-import" 
              style="
                padding: 0.75rem 1.5rem;
                border: 2px solid #e2e8f0;
                background: white;
                color: #64748b;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
                font-weight: 500;
              "
            >
              Start Fresh
            </button>
            <button 
              id="do-import" 
              style="
                padding: 0.75rem 1.5rem;
                border: 2px solid #3b82f6;
                background: #3b82f6;
                color: white;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
                font-weight: 500;
              "
            >
              Import Collection
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Handle button clicks
      modal.querySelector('#skip-import').onclick = () => {
        document.body.removeChild(modal);
        resolve({ import: false, spreadsheetId: null });
      };
      
      modal.querySelector('#do-import').onclick = () => {
        const url = modal.querySelector('#import-url').value.trim();
        const spreadsheetId = this.extractSpreadsheetId(url);
        
        if (!url) {
          // No URL provided, just start fresh
          document.body.removeChild(modal);
          resolve({ import: false, spreadsheetId: null });
          return;
        }
        
        if (!spreadsheetId) {
          alert('Please enter a valid Google Sheets URL');
          return;
        }
        
        document.body.removeChild(modal);
        resolve({ import: true, spreadsheetId: spreadsheetId });
      };
      
      // Close on background click
      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve({ import: false, spreadsheetId: null });
        }
      };
    });
  }

  extractSpreadsheetId(url) {
    if (!url) return null;
    
    // Extract spreadsheet ID from various Google Sheets URL formats
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit/,
      /^([a-zA-Z0-9-_]+)$/ // Just the ID itself
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  async createUserPokemonSheetWithImport(sourceSpreadsheetId) {
    try {
      console.log('📥 Creating new spreadsheet with imported data...');
      this.onSyncStatus?.('📥 Importing your existing collection...');
      
      // Create new spreadsheet
      const createResponse = await gapi.client.sheets.spreadsheets.create({
        resource: {
          properties: {
            title: `${GOOGLE_SHEETS_CONFIG.sheetTitle} (Imported)`
          },
          sheets: GOOGLE_SHEETS_CONFIG.sheets.map(sheet => ({
            properties: {
              title: sheet.name
            }
          }))
        }
      });
      
      const newSpreadsheetId = createResponse.result.spreadsheetId;
      console.log('📄 Created new spreadsheet for import:', newSpreadsheetId);
      
      // Import data from source spreadsheet
      for (const sheet of GOOGLE_SHEETS_CONFIG.sheets) {
        await this.importGenerationData(sourceSpreadsheetId, newSpreadsheetId, sheet);
      }
      
      // Delete the default "Sheet1"
      await this.deleteDefaultSheet(newSpreadsheetId);
      
      return newSpreadsheetId;
      
    } catch (error) {
      console.error('Error creating spreadsheet with import:', error);
      throw error;
    }
  }

  async importGenerationData(sourceSpreadsheetId, targetSpreadsheetId, sheet) {
    try {
      console.log(`📋 Importing ${sheet.name}...`);
      this.onSyncStatus?.(`📋 Importing ${sheet.name}...`);
      
      // Import Pokemon API for fallback data
      const { pokemonAPI } = await import('./pokemon-api.js');
      
      // Try to read data from source spreadsheet
      let sourceData = null;
      try {
        const sourceResponse = await gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: sourceSpreadsheetId,
          range: `'${sheet.name}'!A:C`
        });
        sourceData = sourceResponse.result.values;
        console.log(`✅ Found data in source ${sheet.name}:`, sourceData?.length || 0, 'rows');
      } catch (error) {
        console.log(`❌ Could not read ${sheet.name} from source, using fallback data`);
      }
      
      let values;
      
      if (sourceData && sourceData.length > 1) {
        // Use imported data
        values = sourceData;
        console.log(`📥 Using imported data for ${sheet.name}`);
      } else {
        // Use PokéAPI data for this generation
        const generationPokemon = await pokemonAPI.getPokemonByGeneration(sheet.generation);
        values = [['POKEDEX', 'POKEMON', 'REMAINING']]; // Header row
        
        generationPokemon.forEach(pokemon => {
          const pokedexNumber = `#${pokemon.id.toString().padStart(4, '0')}`;
          values.push([
            pokedexNumber,
            pokemon.name,
            'FALSE'          ]);
        });
        console.log(`📝 Using PokéAPI data for ${sheet.name}`);
      }
      
      // Update the target sheet
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: targetSpreadsheetId,
        range: `'${sheet.name}'!A:C`,
        valueInputOption: 'RAW',
        resource: { values }
      });
      
      console.log(`✅ Successfully populated ${sheet.name}`);
      
    } catch (error) {
      console.error(`Error importing ${sheet.name}:`, error);
      // Continue with other sheets even if one fails
    }
  }

  // Sync methods
  async syncToGoogleSheets(pokemonData, collectionData) {
    if (!this.isAuthenticated) {
      console.log('❌ Cannot sync: not authenticated');
      return false;
    }
    
    this.onSyncStatus?.('Syncing to Google Sheets...');
    
    try {
      // Group Pokemon by generation
      const pokemonByGeneration = {};
      pokemonData.forEach(pokemon => {
        if (!pokemonByGeneration[pokemon.generation]) {
          pokemonByGeneration[pokemon.generation] = [];
        }
        pokemonByGeneration[pokemon.generation].push(pokemon);
      });
      
      // Update each generation sheet using OAuth
      for (const sheet of GOOGLE_SHEETS_CONFIG.sheets) {
        const generationPokemon = pokemonByGeneration[sheet.generation];
        if (generationPokemon && generationPokemon.length > 0) {
          await this.updateSheetDataWithOAuth(sheet, generationPokemon, collectionData);
        }
      }
      
      this.onSyncStatus?.('✅ Synced successfully!');
      setTimeout(() => this.onSyncStatus?.(null), 2000);
      return true;
      
    } catch (error) {
      console.error('Failed to sync to Google Sheets:', error);
      this.onSyncStatus?.('❌ Sync failed');
      setTimeout(() => this.onSyncStatus?.(null), 3000);
      return false;
    }
  }

  async updateSheetDataWithOAuth(sheet, pokemonList, collectionData) {
    // Use user's personal spreadsheet
    const spreadsheetId = GOOGLE_SHEETS_CONFIG.userSpreadsheetId;
    if (!spreadsheetId) {
      throw new Error('No user spreadsheet available for syncing');
    }
    
    // Prepare data for this generation sheet
    const values = [['POKEDEX', 'POKEMON', 'REMAINING']]; // Header row
    
    // Sort Pokemon by ID to maintain order
    pokemonList.sort((a, b) => a.id - b.id);
    
    pokemonList.forEach(pokemon => {
      const isCollected = collectionData[pokemon.id] || false;
      const pokedexNumber = `#${pokemon.id.toString().padStart(4, '0')}`;
      
      values.push([
        pokedexNumber,
        pokemon.name,
        isCollected ? 'TRUE' : 'FALSE'
      ]);
    });
    
    // Update the specific sheet using Google Sheets API via gapi
    const request = {
      spreadsheetId: spreadsheetId,
      range: `'${sheet.name}'!${GOOGLE_SHEETS_CONFIG.range}`,
      valueInputOption: 'RAW',
      resource: { values }
    };
    
    const response = await gapi.client.sheets.spreadsheets.values.update(request);
    
    if (!response || response.status !== 200) {
      throw new Error(`Failed to update ${sheet.name}: ${response.statusText}`);
    }
    
    console.log(`✅ Updated ${sheet.name} successfully`);
  }

  // Authentication persistence methods
  saveAuthenticationState(authData) {
    try {
      const dataToSave = {
        ...authData,
        timestamp: Date.now()
      };
      localStorage.setItem('pokemon-auth-state', JSON.stringify(dataToSave));
      console.log('💾 Authentication state saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save authentication state:', error);
    }
  }

  loadAuthenticationState() {
    try {
      const saved = localStorage.getItem('pokemon-auth-state');
      if (!saved) {
        console.log('📭 No saved authentication state found');
        return null;
      }
      
      const authData = JSON.parse(saved);
      const tokenAge = Date.now() - authData.timestamp;
      const ageInMinutes = Math.round(tokenAge / (1000 * 60));
      
      console.log('📦 Found saved authentication data:', {
        hasAccessToken: !!authData.accessToken,
        hasUserCredential: !!authData.userCredential,
        userName: authData.userCredential?.name,
        timestamp: new Date(authData.timestamp).toLocaleString(),
        ageInMinutes: ageInMinutes,
        isRecent: ageInMinutes < 50
      });
      
      // Check if the saved auth is expired (1 hour = 3600000ms)
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - authData.timestamp > oneHour) {
        console.log('⏰ Saved authentication state has expired, clearing...');
        this.clearAuthenticationState();
        return null;
      }
      
      console.log('📦 Loaded valid authentication state from localStorage');
      return authData;
    } catch (error) {
      console.error('❌ Failed to load authentication state:', error);
      this.clearAuthenticationState();
      return null;
    }
  }

  async restoreAuthenticationState(savedAuth) {
    try {
      console.log('🔄 Attempting to restore authentication state...');
      
      // Test if the saved access token is still valid
      if (!savedAuth.accessToken) {
        console.log('❌ No access token in saved auth');
        return false;
      }
      
      // Ensure gapi client is available
      if (!this.gapi || !this.gapi.client) {
        console.log('❌ Google API client not available for token validation');
        return false;
      }
      
      // Set the token in gapi client
      console.log('🔑 Setting access token in gapi client...');
      this.gapi.client.setToken({ access_token: savedAuth.accessToken });
      
      // For recent tokens (less than 50 minutes old), skip validation to avoid API permission issues
      const tokenAge = Date.now() - savedAuth.timestamp;
      const fiftyMinutes = 50 * 60 * 1000;
      
      if (tokenAge < fiftyMinutes) {
        console.log('✅ Token is recent (less than 50 minutes old), skipping validation');
      } else {
        // Test the token by making a simple API call for older tokens
        try {
          await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' // Google's test sheet
          });
          console.log('✅ Token validation successful');
        } catch (tokenError) {
          console.log('❌ Token validation failed:', tokenError);
          return false;
        }
      }
      
      // Restore authentication state
      console.log('🔄 Restoring authentication state...');
      this.accessToken = savedAuth.accessToken;
      this.userCredential = savedAuth.userCredential;
      this.isAuthenticated = true;
      
      // Update UI
      console.log('🎨 Updating UI to show authenticated status...');
      this.onAuthStateChange?.('authenticated', savedAuth.userCredential?.name || 'User');
      
      // Try to restore spreadsheet connection
      console.log('📊 Setting up user spreadsheet...');
      await this.setupUserSpreadsheet();
      
      console.log('✅ Successfully restored authentication state');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to restore authentication state:', error);
      this.clearAuthenticationState();
      return false;
    }
  }

  clearAuthenticationState() {
    try {
      localStorage.removeItem('pokemon-auth-state');
      console.log('🗑️ Cleared authentication state from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear authentication state:', error);
    }
  }
}
