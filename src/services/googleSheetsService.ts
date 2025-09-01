import { pokemonAPI, type CompletePokemon } from './pokemonAPI'

export interface SheetData {
  spreadsheetId: string
  sheets: Array<{
    sheetId: number
    title: string
    generation: number
  }>
}

export class GoogleSheetsService {
  private spreadsheetTitle = 'Pokemon Collection Tracker'
  private generationSheets = [
    { name: 'GEN 1', generation: 1 },
    { name: 'GEN 2', generation: 2 },
    { name: 'GEN 3', generation: 3 },
    { name: 'GEN 4', generation: 4 },
    { name: 'GEN 5', generation: 5 },
    { name: 'GEN 6', generation: 6 },
    { name: 'GEN 7', generation: 7 },
    { name: 'GEN 8', generation: 8 },
    { name: 'GEN 9', generation: 9 }
  ]

  private tokenRefreshCallback: (() => Promise<boolean>) | null = null

  setTokenRefreshCallback(callback: () => Promise<boolean>) {
    this.tokenRefreshCallback = callback
  }

  private async handleApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
      return await apiCall()
    } catch (error: any) {
      // Check if it's an authentication error
      if (error?.result?.error?.code === 401 || error?.status === 401) {
        console.log('🔄 Authentication error detected, attempting token refresh...')
        
        if (this.tokenRefreshCallback) {
          const refreshed = await this.tokenRefreshCallback()
          
          if (refreshed) {
            console.log('✅ Token refreshed, retrying API call...')
            return await apiCall()
          } else {
            console.log('❌ Token refresh failed')
            throw new Error('Authentication failed and token refresh unsuccessful')
          }
        } else {
          console.log('❌ No token refresh callback available')
          throw new Error('Authentication failed and no refresh mechanism available')
        }
      }
      
      // Re-throw other errors
      throw error
    }
  }

  async findExistingSpreadsheet(): Promise<string | null> {
    try {
      console.log('🔍 Searching for existing Pokemon Collection Tracker...')

      const response = await this.handleApiCall(() => 
        window.gapi!.client.request({
          path: 'https://www.googleapis.com/drive/v3/files',
          params: {
            q: `name='${this.spreadsheetTitle}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
            fields: 'files(id,name,createdTime)'
          }
        })
      )

      const files = response.result.files
      if (files && files.length > 0) {
        console.log(`📄 Found existing spreadsheet: ${files[0].id}`)
        return files[0].id
      }

      console.log('📝 No existing spreadsheet found')
      return null
    } catch (error) {
      console.error('❌ Error searching for spreadsheet:', error)
      return null
    }
  }

  async createPokemonSpreadsheet(): Promise<string> {
    try {
      console.log('🔨 Creating new Pokemon Collection Tracker spreadsheet...')

      // Fetch all Pokemon data
      const pokemonByGeneration = await pokemonAPI.getAllPokemonByGeneration()

      // Create the spreadsheet
      const spreadsheetResponse = await this.handleApiCall(() =>
        window.gapi!.client.sheets.spreadsheets.create({
          resource: {
            properties: {
              title: this.spreadsheetTitle
            },
            sheets: this.generationSheets.map((gen, index) => ({
              properties: {
                sheetId: index,
                title: gen.name,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 3
                }
              }
            }))
          }
        })
      )

      const spreadsheetId = spreadsheetResponse.result.spreadsheetId!
      console.log(`📊 Created spreadsheet: ${spreadsheetId}`)

      // Populate each generation sheet
      for (const genInfo of this.generationSheets) {
        const pokemon = pokemonByGeneration.get(genInfo.generation) || []
        if (pokemon.length > 0) {
          await this.populateGenerationSheet(spreadsheetId, genInfo.name, pokemon)
        }
      }

      console.log('✅ Pokemon Collection Tracker created successfully!')
      return spreadsheetId
    } catch (error) {
      console.error('❌ Error creating spreadsheet:', error)
      throw new Error('Failed to create Pokemon spreadsheet')
    }
  }

  async populateGenerationSheet(spreadsheetId: string, sheetName: string, pokemon: CompletePokemon[]): Promise<void> {
    try {
      console.log(`📝 Populating ${sheetName} with ${pokemon.length} Pokemon...`)

      // Sort Pokemon by ID
      const sortedPokemon = pokemon.sort((a, b) => a.id - b.id)

      // Prepare data with headers
      const values = [
        ['POKEDEX', 'POKEMON', 'COLLECTED'], // Header row
        ...sortedPokemon.map(p => [
          pokemonAPI.formatPokedexNumber(p.id),
          pokemonAPI.formatPokemonName(p.name),
          'FALSE' // Default to not collected (FALSE = not collected yet)
        ])
      ]

      // Write data to sheet
      await this.handleApiCall(() =>
        window.gapi!.client.sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:C${values.length}`,
          valueInputOption: 'RAW',
          resource: {
            values
          }
        })
      )

      // Format the header row
      await this.handleApiCall(() =>
        window.gapi!.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: {
            requests: [{
              repeatCell: {
                range: {
                  sheetId: this.getSheetId(sheetName),
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 3
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.6, blue: 1.0 },
                    textFormat: {
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                      bold: true
                    }
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }]
          }
        })
      )

      console.log(`✅ ${sheetName} populated successfully`)
    } catch (error) {
      console.error(`❌ Error populating ${sheetName}:`, error)
      throw error
    }
  }

  async loadCollectionData(spreadsheetId: string): Promise<Map<number, boolean>> {
    try {
      console.log('📥 Loading collection data from spreadsheet...')
      const collectionStatus = new Map<number, boolean>()

      for (const genInfo of this.generationSheets) {
        const response = await this.handleApiCall(() =>
          window.gapi!.client.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${genInfo.name}!A2:C1000` // Skip header row
          })
        )

        const rows = response.result.values || []
        rows.forEach((row: any[]) => {
          if (row.length >= 3) {
            const pokedexNumber = row[0] // Format: #0001
            const pokemonId = parseInt(pokedexNumber.replace('#', ''))
            const collectionValue = row[2] // Column C value
            const isCollected = collectionValue === 'TRUE' // TRUE = collected, FALSE = not collected
            
            if (!isNaN(pokemonId)) {
              collectionStatus.set(pokemonId, isCollected)
            }
          }
        })
      }

      console.log(`✅ Loaded collection status for ${collectionStatus.size} Pokemon`)
      return collectionStatus
    } catch (error) {
      console.error('❌ Error loading collection data:', error)
      throw error
    }
  }

  async updateCollectionStatus(spreadsheetId: string, pokemonId: number, isCollected: boolean): Promise<void> {
    console.log(`📊 GoogleSheets: updateCollectionStatus called`)
    console.log(`   - Spreadsheet ID: ${spreadsheetId}`)
    console.log(`   - Pokemon ID: ${pokemonId}`)
    console.log(`   - Collection status: ${isCollected ? 'COLLECTED' : 'NOT COLLECTED'}`)
    
    try {
      // Find which generation this Pokemon belongs to
      const generation = this.getPokemonGeneration(pokemonId)
      const sheetName = `GEN ${generation}`
      
      console.log(`📋 GoogleSheets: Pokemon #${pokemonId} belongs to ${sheetName}`)

      // Find the row for this Pokemon
      console.log(`🔍 GoogleSheets: Searching for Pokemon #${pokemonId} in sheet ${sheetName}`)
      
      const response = await this.handleApiCall(() =>
        window.gapi!.client.sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A:C`
        })
      )

      console.log(`📥 GoogleSheets: Retrieved sheet data for ${sheetName}`)
      console.log(`   - Response status: ${response.status}`)
      
      const rows = response.result.values || []
      console.log(`   - Total rows: ${rows.length}`)
      
      let targetRow = -1
      const formattedPokedexNumber = pokemonAPI.formatPokedexNumber(pokemonId)
      
      console.log(`🔍 GoogleSheets: Looking for Pokedex number: ${formattedPokedexNumber}`)

      for (let i = 1; i < rows.length; i++) { // Skip header
        if (rows[i][0] === formattedPokedexNumber) {
          targetRow = i + 1 // Sheets are 1-indexed
          console.log(`✅ GoogleSheets: Found Pokemon at row ${targetRow}`)
          console.log(`   - Row data: [${rows[i].join(', ')}]`)
          break
        }
      }

      if (targetRow > 0) {
        const collectionValue = isCollected ? 'TRUE' : 'FALSE'
        const updateRange = `${sheetName}!C${targetRow}`
        
        console.log(`📝 GoogleSheets: Updating collection status`)
        console.log(`   - Range: ${updateRange}`)
        console.log(`   - Value: ${collectionValue}`)
        
        await this.handleApiCall(() =>
          window.gapi!.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: updateRange,
            valueInputOption: 'RAW',
            resource: {
              values: [[collectionValue]]
            }
          })
        )

        const pokemonName = pokemonAPI.formatPokemonName(rows[targetRow - 1][1])
        console.log(`✅ GoogleSheets: Successfully updated ${pokemonName} status`)
        console.log(`   - Pokemon: ${pokemonName} (#${pokemonId})`)
        console.log(`   - Status: ${isCollected ? 'COLLECTED' : 'NOT COLLECTED'}`)
        console.log(`   - Sheet: ${sheetName}`)
        console.log(`   - Row: ${targetRow}`)
      } else {
        const errorMsg = `Pokemon #${pokemonId} not found in sheet ${sheetName}`
        console.error(`❌ GoogleSheets: ${errorMsg}`)
        console.error(`   - Searched for: ${formattedPokedexNumber}`)
        console.error(`   - Available rows: ${rows.length - 1} (excluding header)`)
        console.error(`   - First few rows:`, rows.slice(0, 5))
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error(`❌ GoogleSheets: Error updating Pokemon ${pokemonId} status:`)
      console.error(`   - Error message: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error(`   - Full error:`, error)
      console.error(`   - Spreadsheet ID: ${spreadsheetId}`)
      console.error(`   - Pokemon ID: ${pokemonId}`)
      console.error(`   - Target status: ${isCollected ? 'COLLECTED' : 'NOT COLLECTED'}`)
      throw error
    }
  }

  private getSheetId(sheetName: string): number {
    const index = this.generationSheets.findIndex(gen => gen.name === sheetName)
    return index >= 0 ? index : 0
  }

  private getPokemonGeneration(pokemonId: number): number {
    // Pokemon generation ranges (approximate)
    if (pokemonId <= 151) return 1
    if (pokemonId <= 251) return 2
    if (pokemonId <= 386) return 3
    if (pokemonId <= 493) return 4
    if (pokemonId <= 649) return 5
    if (pokemonId <= 721) return 6
    if (pokemonId <= 809) return 7
    if (pokemonId <= 905) return 8
    return 9
  }
}

export const googleSheetsService = new GoogleSheetsService()
