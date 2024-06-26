/* eslint-disable @typescript-eslint/no-explicit-any */
import {NOT_ALLOWED_TYPES} from '../consts.js'
import type {PersistAdapter, RestoreFn} from '../types.js'

const DB_NAME = 'statx-store'
const STORE_NAME = 'key-val'
const VERSION = 1

let idb: IDBDatabase

interface StoreValue {
  value: string
  key: string
}

const openDb = async (): Promise<IDBDatabase> => {
  if (idb) {
    return idb
  }
  const db = indexedDB.open(DB_NAME, VERSION)
  return new Promise((r, j) => {
    db.onupgradeneeded = () => {
      if (!db.result.objectStoreNames.contains(STORE_NAME)) {
        db.result.createObjectStore(STORE_NAME, {keyPath: 'key'})
      }
      return r(db.result)
    }
    db.onsuccess = () => {
      return r(db.result)
    }
    db.onerror = j
  })
}

export const removeIDB = () => {
  indexedDB.deleteDatabase(DB_NAME)
}

export class IndexedDBAdapter implements PersistAdapter {
  isAsync = true
  constructor(public restoreFn: RestoreFn<any> | undefined = undefined) {}
  set(name: string, value: unknown) {
    const type = typeof value
    if (NOT_ALLOWED_TYPES.includes(type)) {
      throw new Error('Type ' + type + ' not allowed')
    }
    openDb().then((db) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      store.put({key: name, value: JSON.stringify({value})})
    })
  }

  clear(name: string): void {
    openDb().then((db) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.delete(name)
    })
  }
  async get(name: string) {
    const db = await openDb()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const result = await new Promise<StoreValue>((r, j) => {
      const s = store.get(name)
      s.onsuccess = () => {
        r(s.result as StoreValue)
      }
      s.onerror = j
    })
    if (result) {
      return JSON.parse(result.value).value
    }
  }
}
