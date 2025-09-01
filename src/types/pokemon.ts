export interface Pokemon {
  id: number
  name: string
  sprites: {
    front_default: string
    front_shiny?: string | null
    back_default?: string | null
    back_shiny?: string | null
    front_female?: string | null
    back_female?: string | null
    front_shiny_female?: string | null
    back_shiny_female?: string | null
    other?: {
      'official-artwork'?: {
        front_default?: string
        front_shiny?: string | null
      }
      home?: {
        front_default?: string | null
        front_female?: string | null
        front_shiny?: string | null
        front_shiny_female?: string | null
      }
      dream_world?: {
        front_default?: string | null
        front_female?: string | null
      }
      showdown?: {
        front_default?: string | null
        front_female?: string | null
        front_shiny?: string | null
        front_shiny_female?: string | null
        back_default?: string | null
        back_female?: string | null
        back_shiny?: string | null
        back_shiny_female?: string | null
      }
      // Allow any other sprite collections that might exist
      [key: string]: any
    }
    versions?: {
      'generation-i'?: {
        'red-blue'?: {
          front_default?: string | null
          back_default?: string | null
          front_gray?: string | null
          back_gray?: string | null
          front_transparent?: string | null
          back_transparent?: string | null
        }
        yellow?: {
          front_default?: string | null
          back_default?: string | null
          front_gray?: string | null
          back_gray?: string | null
          front_transparent?: string | null
          back_transparent?: string | null
        }
      }
      'generation-ii'?: {
        crystal?: {
          front_default?: string | null
          front_shiny?: string | null
          back_default?: string | null
          back_shiny?: string | null
          front_transparent?: string | null
          back_transparent?: string | null
          front_shiny_transparent?: string | null
          back_shiny_transparent?: string | null
        }
        gold?: {
          front_default?: string | null
          front_shiny?: string | null
          back_default?: string | null
          back_shiny?: string | null
          front_transparent?: string | null
        }
        silver?: {
          front_default?: string | null
          front_shiny?: string | null
          back_default?: string | null
          back_shiny?: string | null
          front_transparent?: string | null
        }
      }
      'generation-iii'?: {
        emerald?: {
          front_default?: string | null
          front_shiny?: string | null
        }
        'firered-leafgreen'?: {
          back_default?: string | null
          back_shiny?: string | null
          front_default?: string | null
          front_shiny?: string | null
        }
        'ruby-sapphire'?: {
          back_default?: string | null
          back_shiny?: string | null
          front_default?: string | null
          front_shiny?: string | null
        }
      }
      'generation-iv'?: {
        'diamond-pearl'?: {
          back_default?: string | null
          back_female?: string | null
          back_shiny?: string | null
          back_shiny_female?: string | null
          front_default?: string | null
          front_female?: string | null
          front_shiny?: string | null
          front_shiny_female?: string | null
        }
        'heartgold-soulsilver'?: {
          back_default?: string | null
          back_female?: string | null
          back_shiny?: string | null
          back_shiny_female?: string | null
          front_default?: string | null
          front_female?: string | null
          front_shiny?: string | null
          front_shiny_female?: string | null
        }
        platinum?: {
          back_default?: string | null
          back_female?: string | null
          back_shiny?: string | null
          back_shiny_female?: string | null
          front_default?: string | null
          front_female?: string | null
          front_shiny?: string | null
          front_shiny_female?: string | null
        }
      }
      'generation-v'?: {
        'black-white'?: {
          front_default?: string | null
          front_shiny?: string | null
          back_default?: string | null
          back_shiny?: string | null
          front_female?: string | null
          back_female?: string | null
          front_shiny_female?: string | null
          back_shiny_female?: string | null
          animated?: {
            front_default?: string | null
            front_shiny?: string | null
            back_default?: string | null
            back_shiny?: string | null
            front_female?: string | null
            back_female?: string | null
            front_shiny_female?: string | null
            back_shiny_female?: string | null
          }
        }
      }
      'generation-vi'?: {
        'omegaruby-alphasapphire'?: {
          front_default?: string | null
          front_female?: string | null
          front_shiny?: string | null
          front_shiny_female?: string | null
        }
        'x-y'?: {
          front_default?: string | null
          front_female?: string | null
          front_shiny?: string | null
          front_shiny_female?: string | null
        }
      }
      'generation-vii'?: {
        icons?: {
          front_default?: string | null
          front_female?: string | null
        }
        'ultra-sun-ultra-moon'?: {
          front_default?: string | null
          front_female?: string | null
          front_shiny?: string | null
          front_shiny_female?: string | null
        }
      }
      'generation-viii'?: {
        icons?: {
          front_default?: string | null
          front_female?: string | null
        }
      }
      // Allow any other generation that might exist
      [key: string]: any
    }
    // Allow any other sprite properties that might exist
    [key: string]: any
  }
  types: Array<{
    type: {
      name: string
    }
  }>
  height: number
  weight: number
  base_experience: number
  abilities: Array<{
    ability: {
      name: string
    }
    is_hidden: boolean
  }>
  stats: Array<{
    base_stat: number
    stat: {
      name: string
    }
  }>
  species: {
    name: string
    url: string
  }
}

export interface Generation {
  id: number
  name: string
  region: string
  startId: number
  endId: number
}

export interface PokemonType {
  name: string
  color: string
}

export const POKEMON_TYPES: Record<string, PokemonType> = {
  normal: { name: 'Normal', color: '#A8A878' },
  fire: { name: 'Fire', color: '#F08030' },
  water: { name: 'Water', color: '#6890F0' },
  electric: { name: 'Electric', color: '#F8D030' },
  grass: { name: 'Grass', color: '#78C850' },
  ice: { name: 'Ice', color: '#98D8D8' },
  fighting: { name: 'Fighting', color: '#C03028' },
  poison: { name: 'Poison', color: '#A040A0' },
  ground: { name: 'Ground', color: '#E0C068' },
  flying: { name: 'Flying', color: '#A890F0' },
  psychic: { name: 'Psychic', color: '#F85888' },
  bug: { name: 'Bug', color: '#A8B820' },
  rock: { name: 'Rock', color: '#B8A038' },
  ghost: { name: 'Ghost', color: '#705898' },
  dragon: { name: 'Dragon', color: '#7038F8' },
  dark: { name: 'Dark', color: '#705848' },
  steel: { name: 'Steel', color: '#B8B8D0' },
  fairy: { name: 'Fairy', color: '#EE99AC' }
}

export interface AuthState {
  isSignedIn: boolean
  user: {
    name: string
    email: string
    picture: string
  } | null
  accessToken: string | null
}

export interface SyncStatus {
  lastSync: Date | null
  isSyncing: boolean
  hasChanges: boolean
  error: string | null
}

export interface AppSettings {
  autoSync: boolean
  syncInterval: number // minutes
  showGenerationLabels: boolean
  cardSize: 'small' | 'medium' | 'large'
  theme: 'light' | 'dark' | 'auto'
  soundEnabled: boolean
}
