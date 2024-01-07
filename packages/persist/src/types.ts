/* eslint-disable @typescript-eslint/no-explicit-any */
import type {StateType, State, PublicList} from '@statx/core'
import {TAsyncState} from '../../core/build/async-state'

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

export type PersistOptions<T extends StateType> = {
  name: string
  throttle?: number
  onInitRestore?: (value: T) => void
}

export type PersistCreatorOptions<T extends StateType> = {
  name: string
  onInitRestore?: (value: T) => void
}

export type SyncPersistState<T> = T extends State<T>
  ? T & Persist
  : T extends PublicList<any>
  ? T & Persist
  : T extends TAsyncState<T>
  ? T & Persist
  : State<T> & Persist

export type AsyncPersistState<T> = SyncPersistState<T> & {
  isLoading: State<boolean>
}
