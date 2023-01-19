export type Func = (...args: any[]) => any

export type StateType<T extends unknown = unknown> = T extends number
  ? number
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

export type Options = {
  name?: string
}

export type HistoryInternal = {
  historyCursor: number
  history: unknown[]
}

export type CommonInternal<T extends StateType = StateType> =
  HistoryInternal & {
    childs: Set<ComputedInternal<StateType>>
    subscribes: Set<Listner>
    name: string
    onUpdate?: IsFunction<T>
  }

export type StateInternal<T extends StateType> = CommonInternal<T>

export type ComputedInternalOptions<T extends StateType = StateType> = {
  name?: string
  initial?: T
}

export type StatlessFunc<T extends StateType = StateType> = (v?: T) => T

export type GetStatlessFunc<
  T extends StateType,
  S extends StatlessFunc,
  O extends Nullable<ComputedInternalOptions>,
> = T extends -1
  ? S extends () => infer K
    ? () => K
    : O['initial'] extends undefined
    ? (v: unknown) => unknown
    : StatlessFunc<O['initial']>
  : StatlessFunc<T>

export type ComputedInternal<
  T extends StateType,
  R extends StatlessFunc = StatlessFunc,
> = CommonInternal<T> & {
  hasParentUpdates: boolean
  initial?: ReturnType<R>
  isComputing: boolean
  reducer: R
}

export type StateVariants<T extends StateType = StateType> =
  | ComputedInternal<T>
  | StateInternal<T>

export interface Common<T extends StateType> {
  (): T | undefined
  name: string
  subscribe(listner: Listner): UnSubscribe
}
export interface State<T extends StateType> extends Common<T> {
  set: (value: T) => void
}
export type Computed<T extends StateType> = Common<T>
export interface Action<T extends unknown[]> {
  name: string
  run: (...args: T) => void
  onAction?: () => void
}
