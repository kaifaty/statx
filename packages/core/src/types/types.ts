import type {AsyncStatus, CommonInternal, Strategy} from '../helpers/type'

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

export type Listener<T extends StateType = StateType> = (value: T) => void
export type Reducer<T extends StateType = StateType> = (prevState: T) => T

export type SetterValue<T extends Value> = T | ((prevState: T) => T)

export type UnSubscribe = () => void
export type Value = StateType | Reducer
export type SetValue<T extends StateType> = T | ((value: T) => T)

export type Nullable<T> = undefined | T

export type Settings = {
  historyLength: number
}

export interface PublicState<T extends StateType> {
  (): T
  customDeps?: Array<CommonInternal>
  readonly name: string
  subscribe(listener: Listener<T>, subscriberName?: string): UnSubscribe
  peek(): T
}

export interface PublicList<T extends Array<unknown>>
  extends Pick<Array<T[number]>, 'push' | 'pop' | 'splice' | 'shift' | 'unshift'> {
  (): Array<State<T[number]>>
  customDeps?: Array<CommonInternal>
  readonly name: string
  subscribe(listener: Listener<Array<State<T[number]>>>, subscriberName?: string): UnSubscribe
  peek(): Array<State<T[number]>>
  set: (value: T) => void
  at: (index: number) => State<Array<T[number]>>
  map: <P>(fn: (v: State<T[number]>) => P) => Array<P>
  sort: (fn?: (a: T[number], b: T[number]) => number) => Array<State<T[number]>>
  indexOf: (item: State<T[number]>) => number
}

export type State<T extends StateType> = PublicState<T> & {
  set: (value: T) => void
}
export type Computed<T extends StateType> = PublicState<T> & {
  subscribeState(listener: Listener<T>, subscriberName?: string): UnSubscribe
}

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

export type AsyncStateOptions<TResponse> = {
  /**
   * Initial state
   */
  initialValue?: TResponse

  /**
   * Default: last-win
   *
   * last-win - Classic debounce: cancel previous request if new one comes in.
   * first-win - Skip new requests if already requesting
   * first-last - Awaits request complete, after that call's again if was deps changes.
   */
  strategy?: Strategy
  strategyDelay?: number

  /**
   * Default: 0. Zero means unlimited wait
   */
  maxWait?: number
  /**
   * Default true. Auto start watching on props.
   */
  activateOnCreate?: boolean

  /**
   * Default false. Set state to undefined on error
   */
  undefinedOnError?: boolean

  name?: string
}

// TODO strategies 'fist-win' | 'first&last-win'
// TODO isPending isLoaded

export type AsyncState<T> = State<T | undefined> & {
  start(): void
  stop(): void
  isPending: State<boolean>
  error: State<Error | undefined>
  /**
   * Pause: when async state was not started or when stopped
   * Pending: when state start processing
   * idle: when state was start and before or after pending
   *
   */
  status: Computed<AsyncStatus>
}
