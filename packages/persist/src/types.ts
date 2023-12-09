import type {StateType, State} from '@statx/core'

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

export type SyncPersistState = {
  clear(): void
}
export type AsyncPersistState = SyncPersistState & {
  isLoading: State<boolean>
}
