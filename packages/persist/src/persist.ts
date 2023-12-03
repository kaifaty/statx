/* eslint-disable @typescript-eslint/no-explicit-any */
import {state, StateType} from '@statx/core'

import {indexedDBAdapter} from './adapters/indexeddb-storage.js'

import {localStorageAdapter} from './adapters/local-storage.js'

import {
  AsyncStorage,
  PersistCreatorOptions,
  PersistOptions,
  SyncPersistState,
  AsyncPersistState,
  SyncStorage,
} from './types.js'

const uniqNames = new Set<string>()

export const persistState = <S extends PersistCreatorOptions<T>, T extends StateType = StateType>(
  value: T,
  {name, onInitRestore, storage}: S,
): S['storage'] extends AsyncStorage ? AsyncPersistState<T> : SyncPersistState<T> => {
  if (uniqNames.has(name)) {
    throw new Error(`Name: ${name} must be uniq`)
  } else {
    uniqNames.add(name)
  }

  let afterClear = false

  let store: SyncPersistState<T> | AsyncPersistState<T>

  if (storage.isAsync) {
    store = state(value, {name}) as any as AsyncPersistState<T>

    let isLoading = true

    ;(storage as AsyncStorage).get().then((r) => {
      if (r !== undefined) {
        const current = r as T
        store.set(current)
        onInitRestore?.(current)
        isLoading = false
      }
    })

    Object.defineProperty(store, 'isLoading', {
      get() {
        return isLoading
      },
    })
  } else {
    const storeValue = (storage as SyncStorage).get()
    const current = (storeValue ?? value) as T

    store = state(storeValue ?? value, {name}) as SyncPersistState<T>
    onInitRestore?.(current)
  }

  store.subscribe((v: any) => {
    if (afterClear) {
      afterClear = false
      return
    }

    storage.set(v)
  })

  store.clear = () => {
    afterClear = true

    storage.clear()

    store.set(value)
  }

  return store as S['storage'] extends AsyncStorage ? AsyncPersistState<T> : SyncPersistState<T>
}

export const stateLocalStorage = <T extends StateType = StateType>(
  value: T,
  {name, onInitRestore, throttle}: PersistOptions<T>,
) => {
  return persistState(value, {
    name,
    onInitRestore,
    storage: localStorageAdapter(name, throttle),
  })
}

export const stateSessionStorage = <T extends StateType = StateType>(
  value: T,
  {name, onInitRestore, throttle}: PersistOptions<T>,
) => {
  return persistState(value, {
    name,
    onInitRestore,
    storage: localStorageAdapter(name, throttle, true),
  })
}

export const indexeddbStorage = <T extends StateType = StateType>(
  value: T,
  {name, onInitRestore, throttle}: PersistOptions<T>,
) => {
  return persistState(value, {
    name,
    onInitRestore,
    storage: indexedDBAdapter(name, throttle),
  })
}
