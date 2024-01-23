import type {CommonInternal, Strategy} from '../proto/type'

/* eslint-disable @typescript-eslint/no-explicit-any */
export type AnyFunc = (...args: any[]) => any
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
  _historyCursor: number
  _history: unknown[]
}

export interface PublicState<T extends StateType> {
  (): T
  _customDeps?: Array<CommonInternal>
  readonly name: string
  subscribe(listner: Listner<T>): UnSubscribe
  peek(): T
}

export interface PublicList<T extends Array<unknown>>
  extends State<T>,
    Pick<Array<T[number]>, 'sort' | 'push' | 'pop' | 'shift' | 'unshift' | 'at'> {}

export type State<T extends StateType> = PublicState<T> & {
  set: (value: T) => void
}
export type Computed<T extends StateType> = PublicState<T>

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

export type AsycStateOptions<TResponse> = {
  /**
   * Initial state
   */
  initial?: TResponse

  /**
   * Default: last-win
   *
   * last-win - Classic debounce: cancel previouse request if new one comes in.
   * first-win - Skip new requests if already requseting
   * first-last - Awaits request complete, after that call's again if was deps changes.
   */
  stratagy?: Strategy

  /**
   * Default: 0. Zero meens unlimit wait
   */
  maxWait?: number
  /**
   * Default false. Auto start watching on props.
   */
  autoStart?: boolean

  /**
   * Default true. Execute async function on start
   */
  execOnStart?: boolean

  /**
   * Default false. Set state to undefined on error
   */
  undefinedOnError?: boolean

  name?: string
}
