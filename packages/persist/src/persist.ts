/* eslint-disable @typescript-eslint/no-explicit-any */
import type {State, StateType} from '@statx/core'

import {IndexedDBAdapter} from './adapters/indexeddb-storage.js'
import {createLocalAdapter} from './adapters/local-storage.js'

import type {PersistOptions} from './types.js'
import {createPersistState} from './utils.js'

const adapters = {
  localStorage: new (createLocalAdapter(localStorage))(),
  sessionStorage: new (createLocalAdapter(sessionStorage))(),
  indexedDB: new IndexedDBAdapter(),
}

export const stateLocalStorage = <T extends StateType>(value: T | (() => T), options: PersistOptions<T>) =>
  createPersistState<T>(value, adapters.localStorage, options)

export const stateSessionStorage = <T extends StateType = StateType>(
  value: T | (() => T),
  options: PersistOptions<T>,
) => createPersistState<T>(value, adapters.sessionStorage, options)

export const indexedDBStorage = <T extends StateType | State<StateType> = StateType>(
  value: T | (() => T),
  options: PersistOptions<T>,
) => createPersistState<T>(value, adapters.indexedDB, options)
