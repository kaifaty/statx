/* eslint-disable @typescript-eslint/no-explicit-any */
import type {State, AsyncState, PublicList} from '@statx/core'

type Persist = {
  clear(): void
}

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

export type PersistOptions<T> = {
  name: string
  throttle?: number
  onInitRestore?: (value: T) => void
}

export type PersistCreatorOptions<T> = {
  name: string
  onInitRestore?: (value: T) => void
}

export type SyncPersistState<T> = [T] extends [State<any>]
  ? T & Persist
  : [T] extends [PublicList<any>]
  ? T & Persist
  : [T] extends [AsyncState<any>]
  ? T & Persist
  : State<T> & Persist

export type AsyncPersistState<T> = SyncPersistState<T> & {
  isLoading: State<boolean>
}
