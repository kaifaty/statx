export type Func = (...args: unknown[]) => unknown
export type SetterFunc = (value: unknown) => unknown

export type StateType<T extends unknown = unknown> = T extends number
  ? number
  : T extends boolean
  ? boolean
  : T extends bigint
  ? bigint
  : T extends null
  ? null
  : T extends undefined
  ? undefined
  : T extends Array<unknown>
  ? T
  : T extends Record<string | number | symbol, unknown>
  ? T
  : T extends symbol
  ? never
  : T extends Func
  ? never
  : T

export type NonFunction<T> = T extends Func ? never : T
export type IsFunction<T> = T extends Func ? T : never

export type Listner<T extends StateType = StateType> = (value: T) => void
export type Reducer<T extends StateType = StateType> = (prevState: T) => T

export type SetterValue<T extends Value> = T | ((prevState: T) => T)

export type UnSubscribe = () => void
export type Value = StateType | Reducer
export type SetValue<T extends StateType> = T | ((value: T) => T)

export type Nullable<T> = undefined | T

export type Settings = {
  historyLength: number
}

export type HistoryInternal = {
  historyCursor: number
  history: unknown[]
}

export interface CommonInternal extends HistoryInternal {
  id: number
  childs: Record<number, CommonInternal>
  parents: Record<number, CommonInternal>
  subscribes: Set<Listner>
  name: string
  hasParentUpdates: boolean | undefined
}

export type ComputedInternal = CommonInternal & {
  initial?: unknown
  isComputing: boolean
  reducer: SetterFunc
}

export type StateInternal = CommonInternal

export type StateVariants = ComputedInternal | StateInternal

interface Common<T extends StateType> {
  (): T
  _internal: CommonInternal
  name: string
  subscribe(listner: Listner<T>): UnSubscribe
}

export interface PublicState<T> extends Common<T> {}

export type State<T extends StateType> = Common<T> & {
  set: (value: T) => void
}
export type Computed<T extends StateType> = Common<T>

export interface Action<T extends unknown[]> {
  name: string
  run: (...args: T) => void
}

export type ActionOptions = {
  name?: string
}

export type Options = {
  name?: string
}
