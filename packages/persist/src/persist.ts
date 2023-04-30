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

export const persistState = <S extends PersistCreatorOptions, T extends StateType = StateType>(
  value: T,
  {name, storage}: S,
): S['storage'] extends AsyncStorage ? AsyncPersistState<T> : SyncPersistState<T> => {
  if (uniqNames.has(name)) {
    throw new Error(`Name: ${name} must be uniq`)
  } else {
    uniqNames.add(name)
  }

  let afterClear = false

  let store: SyncPersistState<T>

  if (storage.isAsync) {
    store = state(value, {name}) as SyncPersistState<T>

    let isLoading = true

    ;(storage as AsyncStorage).get().then((r) => {
      if (r !== undefined) {
        store.set(r as T)

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

    store = state(storeValue ?? value, {name}) as SyncPersistState<T>
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
  {name, throttle}: PersistOptions,
) => {
  return persistState(value, {
    name,

    storage: localStorageAdapter(name, throttle),
  })
}

export const stateSessionStorage = <T extends StateType = StateType>(
  value: T,
  {name, throttle}: PersistOptions,
) => {
  return persistState(value, {
    name,

    storage: localStorageAdapter(name, throttle, true),
  })
}

export const indexeddbStorage = <T extends StateType = StateType>(
  value: T,
  {name, throttle}: PersistOptions,
) => {
  return persistState(value, {
    name,

    storage: indexedDBAdapter(name, throttle),
  })
}
