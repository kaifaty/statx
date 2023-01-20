import type { StateType, State } from '@statx/core'

interface Storage {
  set(value: unknown): void
  clear(): void
  isAsync: boolean
}
export interface SyncStorage extends Storage {
  get(): unknown
  isAsync: false
}
export interface AsyncStorage extends Storage {
  get(): Promise<unknown>
  isAsync: true
}

export interface PersistOptions {
  name: string
  throttle: number
}

export interface PersistCreatorOptions {
  name: string
  storage: Storage | AsyncStorage
}

export type SyncPersistState<T extends StateType> = State<T> & {
  clear(): void
  isLoading: undefined
}
export type AsyncPersistState<T extends StateType> = SyncPersistState<T> & {
  isLoading: boolean
}
