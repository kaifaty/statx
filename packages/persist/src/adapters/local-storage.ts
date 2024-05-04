/* eslint-disable @typescript-eslint/no-explicit-any */
import {PREFIXES, NOT_ALLOWED_TYPES} from '../consts.js'
import type {PersistAdapter} from '../types.js'

export const createLocalAdapter = (storage: Storage) => {
  const storageName = storage === localStorage ? 'localStorage' : 'sessionStorage'
  const prefix = PREFIXES[storageName]
  return class LocalStorageAdapter implements PersistAdapter {
    isAsync = false
    constructor() {}
    set(name: string, value: unknown) {
      const type = typeof value
      if (NOT_ALLOWED_TYPES.includes(type)) {
        console.error(`[TypeError]: ${type} is not allowed`)
        return
      }
      try {
        storage.setItem(
          prefix + name,
          JSON.stringify({
            value,
            timestamp: Date.now(),
            version: 1,
          }),
        )
      } catch (e) {
        console.error(`[Storage set item error]: ${(e as Error).message}`)
      }
    }
    get(name: string): unknown {
      const v = storage.getItem(prefix + name)
      if (!v) return undefined
      const data = JSON.parse(v)

      return data.value
    }
    clear(name: string): void {
      storage.removeItem(prefix + name)
    }
  }
}
