import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { usePokemonStore } from '../stores/pokemon'
import { samplePokemon } from '../data/samplePokemon'
import { googleSheetsService } from '../services/googleSheetsService'
import { pokemonAPI } from '../services/pokemonAPI'
import { nonBlockingPokemonAPI } from '../services/nonBlockingPokemonAPI'
import { pokemonCache } from '../services/pokemonCache'
import type { Pokemon } from '../types/pokemon'

// Extend the Window interface to include Google APIs
declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void
      client: {
        init: (config: any) => Promise<void>
        setToken: (token: any) => void
        request: (params: any) => Promise<any>
        sheets: {
          spreadsheets: {
            create: (params: any) => Promise<any>
            batchUpdate: (params: any) => Promise<any>
            values: {
              get: (params: any) => Promise<any>
              update: (params: any) => Promise<any>
            }
          }
        }
      }
    }
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: () => void
          disableAutoSelect: () => void
          renderButton: (element: HTMLElement, config: any) => void
        }
        oauth2: {
          initTokenClient: (config: any) => any
        }
      }
    }
  }
}

export function usePokemonServices() {
  const pokemonStore = usePokemonStore()
  
  const isInitialized = ref(false)
  const initError = ref<string | null>(null)
  const syncStatus = ref<string>('')
  const isOnlineMode = ref(false)
  const isLoadingPokemon = ref(false) // Add loading state for Pokemon data
  
  // Persistent auth state using localStorage
  const savedAuthState = useLocalStorage('pokemon-auth-state', {
    accessToken: null as string | null,
    userCredential: null as any,
    timestamp: null as number | null
  })
  
  // Saved spreadsheet ID
  const savedSpreadsheetId = useLocalStorage('pokemon-user-spreadsheet-id', null as string | null)
  
  // Current session state
  const accessToken = ref<string | null>(savedAuthState.value.accessToken)
  const userCredential = ref<any>(savedAuthState.value.userCredential)

  const loadSampleData = () => {
    console.log('Loading sample Pokemon data...')
    pokemonStore.setPokemonData(samplePokemon)
    
    // Mark some Pokemon as collected for demo
    pokemonStore.togglePokemonCollected(1) // Bulbasaur
    pokemonStore.togglePokemonCollected(4) // Charmander
    pokemonStore.togglePokemonCollected(7) // Squirtle
    pokemonStore.togglePokemonCollected(25) // Pikachu
    
    if (!isOnlineMode.value) {
      syncStatus.value = 'Using sample data - Sign in to sync with Google Sheets'
    }
  }

  const loadAllPokemonData = async () => {
    // Prevent duplicate loading
    if (isLoadingPokemon.value) {
      console.log('🔄 Pokemon data already loading, skipping...')
      return
    }
    
    // If we already have Pokemon data, don't reload unless explicitly requested
    if (pokemonStore.allPokemon.length > 100) {
      console.log('📦 Pokemon data already loaded, skipping...')
      return
    }

    try {
      isLoadingPokemon.value = true
      pokemonStore.setLoading(true)
      
      // First, try to load from cache
      console.log('🗄️ Checking for cached Pokemon data...')
      const cachedPokemon = pokemonCache.loadFromCache()
      
      if (cachedPokemon && cachedPokemon.length > 0) {
        console.log(`✅ Found ${cachedPokemon.length} Pokemon in cache, loading instantly!`)
        pokemonStore.setPokemonData(cachedPokemon)
        syncStatus.value = `Loaded ${cachedPokemon.length} Pokemon from cache`
        
        // Set loading to false immediately for cached data
        isLoadingPokemon.value = false
        pokemonStore.setLoading(false)
        
        // Clear status after 3 seconds
        setTimeout(() => {
          if (syncStatus.value.includes('cache')) {
            syncStatus.value = isOnlineMode.value ? 'Connected to Google Sheets' : 'Offline mode'
          }
        }, 3000)
        
        return
      }
      
      // No cache found, load from API
      console.log('🎯 No valid cache found, loading from PokeAPI with non-blocking approach...')
      syncStatus.value = 'Loading Pokemon from PokeAPI...'
      
      await nonBlockingPokemonAPI.loadAllPokemonNonBlocking(
        // Progress callback
        (progress) => {
          syncStatus.value = progress.message
          console.log(`📊 ${progress.message} (${progress.progress}/${progress.total})`)
        },
        
        // Partial data callback - don't update UI progressively, just track progress
        (partialPokemon) => {
          // Just log progress, don't update the store yet
          console.log(`📦 Loaded ${partialPokemon.length} more Pokemon...`)
        },
        
        // Complete callback - only update UI when everything is loaded
        (allPokemon) => {
          console.log(`✅ Successfully loaded ${allPokemon.length} Pokemon from PokeAPI`)
          pokemonStore.setPokemonData(allPokemon)
          
          // Cache the data for future use
          pokemonCache.saveToCache(allPokemon)
          
          // Set loading to false here when complete
          isLoadingPokemon.value = false
          pokemonStore.setLoading(false)
          
          syncStatus.value = `Loaded ${allPokemon.length} Pokemon successfully!`
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            if (syncStatus.value.includes('Loaded')) {
              syncStatus.value = isOnlineMode.value ? 'Connected to Google Sheets' : 'Offline mode'
            }
          }, 3000)
        },
        
        // Error callback
        (error) => {
          console.error('❌ Non-blocking loading error:', error)
          console.log('📦 Falling back to sample data...')
          loadSampleData()
          syncStatus.value = 'Failed to load Pokemon data - using sample data'
          
          // Set loading to false on error
          isLoadingPokemon.value = false
          pokemonStore.setLoading(false)
        }
      )
      
    } catch (error) {
      console.error('❌ Error loading Pokemon data:', error)
      console.log('📦 Falling back to sample data...')
      loadSampleData()
      syncStatus.value = 'Failed to load Pokemon data - using sample data'
      
      // Set loading to false on catch
      isLoadingPokemon.value = false
      pokemonStore.setLoading(false)
    }
  }

  const handleCredentialResponse = (response: any) => {
    try {
      console.log('🔐 Received credential response from Google')
      const credential = parseJwtCredential(response.credential)
      console.log('👤 User signed in:', credential.name, credential.email)
      
      userCredential.value = credential

      // Now request OAuth2 permissions for Google Sheets access
      console.log('📊 Requesting Google Sheets permissions...')

      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: (tokenResponse: any) => {
          console.log('🎫 Received access token:', !!tokenResponse.access_token)
          accessToken.value = tokenResponse.access_token
          
          // Set the token for gapi client
          if (window.gapi?.client) {
            window.gapi.client.setToken({ access_token: tokenResponse.access_token })
          }
          
          // Save authentication state to localStorage
          savedAuthState.value = {
            accessToken: tokenResponse.access_token,
            userCredential: credential,
            timestamp: Date.now()
          }
          
          console.log('💾 Authentication state saved to localStorage')
          
          pokemonStore.setAuthenticated(true)
          pokemonStore.setAuthError(null)
          isOnlineMode.value = true
          syncStatus.value = 'Connected to Google Sheets'
          
          // Set up user's Pokemon spreadsheet
          setupUserSpreadsheet()
        }
      })
      
      // Request the token (this will show OAuth consent popup)
      tokenClient.requestAccessToken({ prompt: 'consent' })
      
    } catch (error) {
      console.error('❌ Authentication failed:', error)
      pokemonStore.setAuthError('Authentication failed')
    }
  }

  const parseJwtCredential = (credential: string) => {
    const base64Url = credential.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  }

  const isTokenExpired = (): boolean => {
    if (!savedAuthState.value.timestamp) return true
    
    // Google access tokens typically expire after 1 hour (3600 seconds)
    const expirationTime = savedAuthState.value.timestamp + (3600 * 1000) // 1 hour in milliseconds
    const now = Date.now()
    
    return now >= expirationTime
  }

  const refreshAccessToken = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!userCredential.value) {
        console.log('❌ No user credential available for token refresh')
        resolve(false)
        return
      }

      console.log('🔄 Refreshing access token...')
      
      const tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        callback: (tokenResponse: any) => {
          if (tokenResponse.access_token) {
            console.log('✅ Access token refreshed successfully')
            accessToken.value = tokenResponse.access_token
            
            // Set the new token for gapi client
            if (window.gapi?.client) {
              window.gapi.client.setToken({ access_token: tokenResponse.access_token })
            }
            
            // Update saved authentication state
            savedAuthState.value = {
              accessToken: tokenResponse.access_token,
              userCredential: userCredential.value,
              timestamp: Date.now()
            }
            
            resolve(true)
          } else {
            console.log('❌ Failed to refresh access token')
            resolve(false)
          }
        }
      })
      
      // Request the token silently (without showing popup if possible)
      tokenClient.requestAccessToken({ prompt: '' })
    })
  }

  const restoreAuthenticationState = async () => {
    try {
      console.log('🔄 Restoring authentication state...')
      
      // Check if we have saved auth data
      if (!savedAuthState.value.accessToken || !savedAuthState.value.userCredential) {
        console.log('❌ No saved authentication state found')
        return false
      }
      
      accessToken.value = savedAuthState.value.accessToken
      userCredential.value = savedAuthState.value.userCredential
      
      // Check if token is expired
      if (isTokenExpired()) {
        console.log('⏰ Access token expired, attempting refresh...')
        const refreshed = await refreshAccessToken()
        
        if (!refreshed) {
          console.log('❌ Failed to refresh token, clearing auth state')
          clearAuthenticationState()
          return false
        }
      } else {
        // Token is still valid, set it for gapi client
        if (window.gapi?.client && accessToken.value) {
          window.gapi.client.setToken({ access_token: accessToken.value })
        }
      }
      
      pokemonStore.setAuthenticated(true)
      pokemonStore.setAuthError(null)
      isOnlineMode.value = true
      syncStatus.value = 'Connected to Google Sheets'
      
      // Load spreadsheet data if available
      if (savedSpreadsheetId.value) {
        await loadSpreadsheetData(savedSpreadsheetId.value)
      }
      
      console.log('✅ Authentication state restored')
      return true
    } catch (error) {
      console.error('❌ Failed to restore authentication state:', error)
      clearAuthenticationState()
      return false
    }
  }

  const clearAuthenticationState = () => {
    try {
      console.log('🗑️ Clearing authentication state...')
      
      savedAuthState.value = {
        accessToken: null,
        userCredential: null,
        timestamp: null
      }
      
      accessToken.value = null
      userCredential.value = null
      
      console.log('✅ Authentication state cleared')
    } catch (error) {
      console.error('❌ Failed to clear authentication state:', error)
    }
  }

  const setupUserSpreadsheet = async () => {
    try {
      syncStatus.value = 'Setting up your Pokemon tracker...'
      
      // Check if user already has a spreadsheet saved
      if (savedSpreadsheetId.value) {
        console.log('📄 Found saved spreadsheet ID:', savedSpreadsheetId.value)
        const hasAccess = await verifySpreadsheetAccess(savedSpreadsheetId.value)
        if (hasAccess) {
          await loadSpreadsheetData(savedSpreadsheetId.value)
          syncStatus.value = '✅ Connected to your Pokemon tracker!'
          return
        } else {
          console.log('❌ User lost access to saved spreadsheet, will search for existing one')
          savedSpreadsheetId.value = null
        }
      }

      // Search for existing spreadsheet
      console.log('🔍 Searching for existing Pokemon Collection Tracker...')
      const existingSpreadsheetId = await googleSheetsService.findExistingSpreadsheet()
      
      if (existingSpreadsheetId) {
        console.log('📄 Found existing spreadsheet:', existingSpreadsheetId)
        savedSpreadsheetId.value = existingSpreadsheetId
        await loadSpreadsheetData(existingSpreadsheetId)
        syncStatus.value = '✅ Connected to existing Pokemon tracker!'
      } else {
        console.log('🆕 Creating new Pokemon tracker spreadsheet...')
        syncStatus.value = 'Creating your Pokemon tracker with all Pokemon data...'
        
        const newSpreadsheetId = await googleSheetsService.createPokemonSpreadsheet()
        savedSpreadsheetId.value = newSpreadsheetId
        await loadSpreadsheetData(newSpreadsheetId)
        syncStatus.value = '✅ New Pokemon tracker created!'
      }
      
      // Clear status after 3 seconds
      setTimeout(() => {
        if (syncStatus.value.includes('✅')) {
          syncStatus.value = 'Connected to Google Sheets'
        }
      }, 3000)
      
    } catch (error) {
      console.error('❌ Failed to setup spreadsheet:', error)
      syncStatus.value = 'Failed to setup Pokemon tracker'
      pokemonStore.setAuthError('Failed to setup Google Sheets integration')
    }
  }

  const verifySpreadsheetAccess = async (spreadsheetId: string): Promise<boolean> => {
    try {
      await window.gapi!.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'GEN 1!A1:A1'
      })
      return true
    } catch (error) {
      console.error('❌ Cannot access spreadsheet:', error)
      return false
    }
  }

  const loadSpreadsheetData = async (spreadsheetId: string) => {
    try {
      console.log('📥 Loading Pokemon data from spreadsheet...')
      syncStatus.value = 'Loading your Pokemon collection...'
      
      const collectionStatus = await googleSheetsService.loadCollectionData(spreadsheetId)
      
      // Ensure Pokemon data is loaded (but don't reload if already loaded)
      if (pokemonStore.allPokemon.length === 0) {
        await loadAllPokemonData()
      }
      
      // Clear current collection status and apply fresh data from spreadsheet
      pokemonStore.setCollectionStatus({})
      
      // Apply collection status from spreadsheet
      collectionStatus.forEach((isCollected, pokemonId) => {
        if (isCollected) {
          pokemonStore.togglePokemonCollected(pokemonId)
        }
      })
      
      console.log(`✅ Loaded collection status for ${collectionStatus.size} Pokemon`)
      syncStatus.value = 'Collection synced from Google Sheets'
      
      // Clear status after 3 seconds
      setTimeout(() => {
        if (syncStatus.value.includes('synced')) {
          syncStatus.value = 'Connected to Google Sheets'
        }
      }, 3000)
      
    } catch (error) {
      console.error('❌ Failed to load spreadsheet data:', error)
      syncStatus.value = 'Failed to sync from Google Sheets'
      // Fallback to all Pokemon data if not already loaded
      if (pokemonStore.allPokemon.length === 0) {
        await loadAllPokemonData()
      }
    }
  }

  const refreshFromSheets = async () => {
    if (!savedSpreadsheetId.value) {
      console.log('❌ No spreadsheet ID found')
      syncStatus.value = 'No Google Sheets connected'
      return false
    }

    try {
      console.log('🔄 Refreshing collection from Google Sheets...')
      await loadSpreadsheetData(savedSpreadsheetId.value)
      return true
    } catch (error) {
      console.error('❌ Failed to refresh from sheets:', error)
      return false
    }
  }

  const initializeGoogleServices = async (): Promise<void> => {
    try {
      console.log('🔧 Initializing Google Identity Services...')

      // Load Google Identity Services script
      await loadGoogleIdentityScript()
      
      // Initialize Google Identity Services
      window.google!.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: false
      })

      console.log('✅ Google Identity Services initialized')

      // Load Google API client for Sheets access
      console.log('📄 Loading Google API client...')
      await loadGoogleAPIScript()
      
      // Load the client library
      await new Promise<void>((resolve) => {
        window.gapi!.load('client', async () => {
          console.log('🔧 Initializing gapi client...')
          await window.gapi!.client.init({
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
          })
          console.log('✅ gapi client initialized')
          
          // Set up token refresh callback for Google Sheets service
          googleSheetsService.setTokenRefreshCallback(refreshAccessToken)
          console.log('🔄 Token refresh callback configured')
          
          // Check for saved authentication state
          if (savedAuthState.value.accessToken && savedAuthState.value.userCredential) {
            const authAge = Date.now() - (savedAuthState.value.timestamp || 0)
            const isAuthValid = authAge < 24 * 60 * 60 * 1000 // 24 hours
            
            if (isAuthValid) {
              console.log('📦 Found valid saved authentication, restoring...')
              await restoreAuthenticationState()
              resolve()
              return
            } else {
              console.log('⏰ Saved authentication expired, clearing...')
              clearAuthenticationState()
            }
          }
          
          resolve()
        })
      })
      
      await loadAllPokemonData()
      
    } catch (error) {
      console.error('❌ Failed to initialize Google services:', error)
      throw error
    }
  }

  const loadGoogleIdentityScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve()
        return
      }
      
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google Identity script'))
      document.head.appendChild(script)
    })
  }

  const loadGoogleAPIScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve()
        return
      }
      
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google API script'))
      document.head.appendChild(script)
    })
  }

  const initializeServices = async () => {
    try {
      pokemonStore.setLoading(true)
      initError.value = null

      // Check if Google client ID is configured and origins are authorized
      const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID
      
      // Enable Google OAuth now that we're using the correct API
      const isGoogleConfigured = true // Using Google API Client Library with popup
      
      if (!clientId || clientId === 'your_google_client_id_here' || !isGoogleConfigured) {
        console.warn('Google OAuth not configured or origins not authorized, using sample data')
        loadSampleData()
        isInitialized.value = true
        return
      }

      // Initialize Google services when client ID is configured
      await initializeGoogleServices()
      isInitialized.value = true
      
    } catch (error) {
      console.error('Failed to initialize services:', error)
      initError.value = error instanceof Error ? error.message : 'Unknown error'
      pokemonStore.setAuthError(initError.value)
      // Fallback to sample data
      loadSampleData()
    } finally {
      pokemonStore.setLoading(false)
    }
  }

  const signIn = async () => {
    try {
      pokemonStore.setLoading(true)
      
      // For demo mode only - the real sign-in is handled by the Google button
      console.log('Demo sign-in mode')
      pokemonStore.setAuthenticated(true)
      pokemonStore.setAuthError(null)
      isOnlineMode.value = true
      syncStatus.value = 'Connected to Google Sheets (demo mode)'
      return { success: true }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      pokemonStore.setAuthError(errorMessage)
      console.error('Sign in error:', error)
      return { success: false, error: errorMessage }
    } finally {
      pokemonStore.setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      // Sign out from Google Identity Services
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect()
      }

      // Clear authentication state
      clearAuthenticationState()

      // Clear gapi token
      if (window.gapi?.client) {
        window.gapi.client.setToken(null)
      }

      pokemonStore.setAuthenticated(false)
      pokemonStore.setAuthError(null)
      isOnlineMode.value = false
      loadSampleData()
      
      console.log('✅ Signed out successfully')
    } catch (error) {
      console.error('❌ Sign out error:', error)
    }
  }

  const syncToSheets = async () => {
    if (!pokemonStore.isAuthenticated || !savedSpreadsheetId.value) {
      console.warn('Cannot sync - not authenticated or no spreadsheet')
      return { success: false, error: 'Not authenticated or no spreadsheet found' }
    }

    try {
      syncStatus.value = 'Syncing to Google Sheets...'
      
      // Get all collected Pokemon from the store
      const collectedPokemon = pokemonStore.allPokemon.filter(p => pokemonStore.isCollected(p.id))
      
      console.log(`🔄 Syncing ${collectedPokemon.length} collected Pokemon to spreadsheet...`)
      
      // Update each collected Pokemon in the spreadsheet
      for (const pokemon of collectedPokemon) {
        await googleSheetsService.updateCollectionStatus(
          savedSpreadsheetId.value, 
          pokemon.id, 
          true
        )
      }
      
      syncStatus.value = 'Sync completed successfully'
      pokemonStore.updateSyncTime()
      
      // Clear status after 3 seconds
      setTimeout(() => {
        syncStatus.value = 'Connected to Google Sheets'
      }, 3000)
      
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed'
      syncStatus.value = `Sync failed: ${errorMessage}`
      console.error('Sync error:', error)
      return { success: false, error: errorMessage }
    }
  }

  const syncPokemonToSheets = async (pokemonId: number, isCollected: boolean) => {
    if (!pokemonStore.isAuthenticated || !savedSpreadsheetId.value) {
      console.warn('Cannot sync - not authenticated or no spreadsheet')
      return { success: false, error: 'Not authenticated or no spreadsheet found' }
    }

    try {
      await googleSheetsService.updateCollectionStatus(
        savedSpreadsheetId.value, 
        pokemonId, 
        isCollected
      )
      
      console.log(`✅ Synced Pokemon #${pokemonId} to sheets: ${isCollected ? 'collected' : 'not collected'}`)
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Individual sync failed'
      console.error(`❌ Error syncing Pokemon #${pokemonId}:`, error)
      return { success: false, error: errorMessage }
    }
  }

  const renderGoogleSignInButton = (buttonElement: HTMLElement) => {
    if (window.google?.accounts?.id && buttonElement) {
      window.google.accounts.id.renderButton(buttonElement, {
        theme: 'outline',
        size: 'large',
        width: 250
      })
      return true
    }
    return false
  }

  const refreshPokemonCache = async () => {
    console.log('🔄 Manually refreshing Pokemon cache...')
    
    // Clear existing cache
    pokemonCache.clearCache()
    
    // Clear current Pokemon data
    pokemonStore.setPokemonData([])
    
    // Force reload from API
    await loadAllPokemonData()
  }

  return {
    // State
    isInitialized,
    initError,
    syncStatus,
    isOnlineMode,
    isLoadingPokemon,
    
    // Methods
    initializeServices,
    signIn,
    signOut,
    syncToSheets,
    syncPokemonToSheets,
    renderGoogleSignInButton,
    loadAllPokemonData,
    loadSampleData,
    refreshFromSheets,
    refreshPokemonCache
  }
}
