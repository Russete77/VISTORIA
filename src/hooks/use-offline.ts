'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseOfflineOptions {
  onOnline?: () => void
  onOffline?: () => void
}

interface OfflineState {
  isOffline: boolean
  isOnline: boolean
  wasOffline: boolean
}

/**
 * Hook para gerenciar estado offline/online
 * Detecta mudanças de conectividade e permite callbacks
 */
export function useOffline(options: UseOfflineOptions = {}): OfflineState {
  const { onOnline, onOffline } = options

  const [state, setState] = useState<OfflineState>({
    isOffline: false,
    isOnline: true,
    wasOffline: false,
  })

  const handleOnline = useCallback(() => {
    setState(prev => ({
      isOffline: false,
      isOnline: true,
      wasOffline: prev.isOffline,
    }))
    onOnline?.()
  }, [onOnline])

  const handleOffline = useCallback(() => {
    setState({
      isOffline: true,
      isOnline: false,
      wasOffline: false,
    })
    onOffline?.()
  }, [onOffline])

  useEffect(() => {
    // Estado inicial
    if (typeof navigator !== 'undefined') {
      setState({
        isOffline: !navigator.onLine,
        isOnline: navigator.onLine,
        wasOffline: false,
      })
    }

    // Event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return state
}

/**
 * Hook para gerenciar dados offline com IndexedDB
 */
export function useOfflineStorage<T>(storeName: string) {
  const [isReady, setIsReady] = useState(false)
  const [db, setDb] = useState<IDBDatabase | null>(null)

  useEffect(() => {
    const request = indexedDB.open('vistoria-offline', 1)

    request.onerror = () => {
      console.error('Failed to open IndexedDB')
    }

    request.onsuccess = () => {
      setDb(request.result)
      setIsReady(true)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Stores para dados offline
      if (!database.objectStoreNames.contains('pending-photos')) {
        database.createObjectStore('pending-photos', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('draft-inspections')) {
        database.createObjectStore('draft-inspections', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('cached-properties')) {
        database.createObjectStore('cached-properties', { keyPath: 'id' })
      }
    }

    return () => {
      db?.close()
    }
  }, [])

  const save = useCallback(async (id: string, data: T): Promise<void> => {
    if (!db) throw new Error('Database not ready')

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const request = store.put({ id, data, timestamp: Date.now() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }, [db, storeName])

  const get = useCallback(async (id: string): Promise<T | null> => {
    if (!db) throw new Error('Database not ready')

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result?.data || null)
      request.onerror = () => reject(request.error)
    })
  }, [db, storeName])

  const getAll = useCallback(async (): Promise<T[]> => {
    if (!db) throw new Error('Database not ready')

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result.map(r => r.data))
      request.onerror = () => reject(request.error)
    })
  }, [db, storeName])

  const remove = useCallback(async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not ready')

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }, [db, storeName])

  const clear = useCallback(async (): Promise<void> => {
    if (!db) throw new Error('Database not ready')

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      const store = tx.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }, [db, storeName])

  return {
    isReady,
    save,
    get,
    getAll,
    remove,
    clear,
  }
}

/**
 * Registra background sync para sincronizar quando voltar online
 */
export async function registerBackgroundSync(tag: string = 'sync-photos') {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready
      await (registration as any).sync.register(tag)
      return true
    } catch (error) {
      console.error('Background sync registration failed:', error)
      return false
    }
  }
  return false
}
