/* eslint-disable @typescript-eslint/no-explicit-any */
import {isStateType, State, state, StateType} from '@statx/core'

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

// TODO разделить неймспейсы для кажого хранилизща
const assertUnuniqNames = (name: string) => {
  if (uniqNames.has(name)) {
    throw new Error(`Name: ${name} must be uniq`)
  }
}
class Persist {
  value: State<unknown>
  storage: AsyncStorage | SyncStorage
  initialValue: unknown
  constructor(value: unknown, storage: AsyncStorage | SyncStorage, {name}: PersistCreatorOptions<any>) {
    this.storage = storage as any
    if (isStateType(value)) {
      this.initialValue = value()
      this.value = value as State<unknown>
    } else {
      this.initialValue = value
      this.value = state<unknown>(this.initialValue, {name})
    }
    this.value.subscribe((value) => {
      this.storage.set(value)
    })

    Object.defineProperty(this.value, 'clear', {
      writable: false,
      configurable: false,
      value: () => {
        this.storage.clear()
        this.value.set(this.initialValue)
        uniqNames.delete(name)
      },
    })
  }
}

class SyncPersist extends Persist {
  constructor(value: unknown, storage: SyncStorage, {name, onInitRestore}: PersistCreatorOptions<any>) {
    super(value, storage, {name, onInitRestore})
    const storeValue = storage.get()
    if (storeValue) {
      this.value.set(storeValue)
    }
    onInitRestore?.(this.value())
  }
}
class AsyncPersist extends Persist {
  constructor(value: unknown, storage: AsyncStorage, {name, onInitRestore}: PersistCreatorOptions<any>) {
    super(value, storage, {name, onInitRestore})

    Object.defineProperty(this.value, 'isLoading', {
      writable: false,
      configurable: false,
      value: state(false),
    })

    this.value.set(value)
    ;(this.storage as AsyncStorage)
      .get()
      .then((restored) => {
        this.value.set(restored ?? value)
      })
      .finally(() => {
        ;(this.value as any).isLoading.set(false)
        onInitRestore?.(this.value())
      })
  }
}

export const persistSyncState = <S extends PersistCreatorOptions<T>, T extends StateType | State<StateType>>(
  value: T,
  storage: SyncStorage,
  options: S,
): typeof value extends State<any> ? T & SyncPersistState : State<T> & SyncPersistState => {
  assertUnuniqNames(options.name)
  uniqNames.add(options.name)
  const res = new SyncPersist(value, storage, options)
  return res.value as any
}

export const persistAsyncState = <S extends PersistCreatorOptions<T>, T extends StateType = StateType>(
  value: T | State<T>,
  storage: AsyncStorage,
  options: S,
): typeof value extends State<T> ? T & AsyncPersistState : State<T> & AsyncPersistState => {
  assertUnuniqNames(options.name)
  uniqNames.add(options.name)
  const res = new AsyncPersist(value, storage, options)
  return res.value as any
}

export const stateLocalStorage = <T extends StateType | State<StateType> = StateType>(
  value: T,
  {name, onInitRestore, throttle}: PersistOptions<T>,
) => {
  return persistSyncState(value, localStorageAdapter(name, throttle), {
    name,
    onInitRestore,
  })
}

export const stateSessionStorage = <T extends StateType | State<StateType> = StateType>(
  value: T,
  {name, onInitRestore, throttle}: PersistOptions<T>,
) => {
  return persistSyncState(value, localStorageAdapter(name, throttle, true), {
    name,
    onInitRestore,
  })
}

export const indexeddbStorage = <T extends StateType = StateType>(
  value: T | State<T>,
  {name, onInitRestore, throttle}: PersistOptions<T>,
) => {
  return persistAsyncState(value, indexedDBAdapter(name, throttle), {
    name,
    onInitRestore,
  })
}
