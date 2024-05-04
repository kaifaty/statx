/* eslint-disable @typescript-eslint/no-explicit-any */
import {PREFIXES} from '../consts'
import {createPersistState} from '../utils'
import type {PersistAdapter, PersistOptions} from '../types'

const createStore = (): Storage => {
  let store = {} as Record<string, string>

  return {
    key() {
      return ''
    },
    getItem(name: string) {
      return store[name]
    },
    removeItem(name: string) {
      delete store[name]
    },
    setItem(name: string, value: string) {
      store[name] = value
    },
    get length() {
      return Object.keys(store).length
    },
    clear() {
      store = {}
    },
  }
}

const createAsyncTestAdapter = (): PersistAdapter => {
  const store = {} as Record<string, string>
  return {
    isAsync: true,
    get(name: string) {
      return Promise.resolve(store[name])
    },
    async set(name: string, value: unknown) {
      //@ts-ignore
      store[name] = value
      await 1
    },
    clear(name: string): void {
      delete store[name]
    },
  }
}

export const getKey = (name: string, isSession = false) => {
  return (isSession ? PREFIXES.sessionStorage : PREFIXES.localStorage) + name
}

export const getFromLocal = (name: string, isSession = false) => {
  try {
    const key = getKey(name, isSession)
    const value = isSession ? sessionStorage.getItem(key) : localStorage.getItem(key)
    if (value) {
      return JSON.parse(value).value
    }
  } catch {
    return
  }
}

const asyncAdapter = createAsyncTestAdapter()

export const testAsyncStorage = (value: any, {name, onPersisStateInit, throttle}: PersistOptions<any>) => {
  return createPersistState(value, asyncAdapter, {
    name,
    onPersisStateInit,
    throttle,
  })
}

//@ts-ignore
globalThis.localStorage = createStore()
//@ts-ignore
globalThis.sessionStorage = createStore()
