// Service for managing Pokemon data loading via Web Worker
import type { Pokemon } from '../types/pokemon'

export interface PokemonLoadProgress {
  message: string
  progress: number
  total: number
}

export interface PokemonWorkerMessage {
  type: 'progress' | 'partial_data' | 'complete' | 'error'
  data: any
}

class PokemonWorkerService {
  private worker: Worker | null = null
  private isLoading = false

  createWorker(): Worker {
    if (this.worker) {
      this.worker.terminate()
    }
    
    this.worker = new Worker('/pokemon-worker.js')
    return this.worker
  }

  async loadAllPokemon(
    onProgress?: (progress: PokemonLoadProgress) => void,
    onPartialData?: (pokemon: Pokemon[]) => void,
    onComplete?: (pokemon: Pokemon[]) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (this.isLoading) {
      console.warn('Pokemon loading already in progress')
      return
    }

    this.isLoading = true
    const worker = this.createWorker()

    return new Promise((resolve, reject) => {
      worker.onmessage = (e: MessageEvent<PokemonWorkerMessage>) => {
        const { type, data } = e.data

        switch (type) {
          case 'progress':
            onProgress?.(data as PokemonLoadProgress)
            break

          case 'partial_data':
            onPartialData?.(data.pokemon as Pokemon[])
            onProgress?.({
              message: `Loaded ${data.progress}/${data.total} Pokemon...`,
              progress: data.progress,
              total: data.total
            })
            break

          case 'complete':
            this.isLoading = false
            onComplete?.(data.pokemon as Pokemon[])
            onProgress?.({
              message: data.message,
              progress: data.pokemon.length,
              total: data.pokemon.length
            })
            worker.terminate()
            resolve()
            break

          case 'error':
            this.isLoading = false
            onError?.(data.message)
            worker.terminate()
            reject(new Error(data.message))
            break

          default:
            console.warn('Unknown worker message type:', type)
        }
      }

      worker.onerror = (error) => {
        this.isLoading = false
        onError?.(`Worker error: ${error.message}`)
        worker.terminate()
        reject(error)
      }

      // Start the loading process
      worker.postMessage({ type: 'load_all_pokemon' })
    })
  }

  terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.isLoading = false
  }

  get loading(): boolean {
    return this.isLoading
  }
}

export const pokemonWorkerService = new PokemonWorkerService()
