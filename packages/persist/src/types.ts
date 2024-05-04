/* eslint-disable @typescript-eslint/no-explicit-any */
import type {State, AsyncState, PublicList} from '@statx/core'

type Persist = {
  clear(): void
}
export type RestoreFn<T> = (data: any) => T
export type OnInitRestore<T> = (value: T) => void

export interface PersistAdapter {
  isAsync: boolean
  get(name: string): unknown | Promise<unknown>
  set(name: string, value: unknown): void
  clear(name: string): void
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
  restoreFn?: RestoreFn<T>
  onPersisStateInit?: (value: T) => void
}

export type PersistState<T> = [T] extends [State<any>]
  ? T & Persist
  : [T] extends [PublicList<any>]
  ? T & Persist
  : [T] extends [AsyncState<any>]
  ? T & Persist
  : State<T> & Persist
