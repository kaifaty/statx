/* eslint-disable @typescript-eslint/no-explicit-any */
import {Computed, SetterFunc, State, UnSubscribe} from '../types'
export type HistoryChange = {
  reason: 'outside' | 'calc'
  changer: Array<CommonInternal> | undefined
  value: unknown
  ts: number
}

export type StatusKey = keyof SettableStatus

export interface SettableStatus {
  id: number
  type: number
  hasParentUpdate: number
  historyCursor: number
  computing: number
  async: number
  invalidated?: number
}

//[0, listener, 1, child, 2, parent]
export interface CommonInternal extends SettableStatus {
  // listeners: Array<Listner>
  // children: Set<CommonInternal>
  // parents: Set<CommonInternal>
  deps: Array<number | CommonInternal | Listner>

  initial?: unknown
  currentValue: unknown
  prevValue: unknown
  customDeps?: Array<CommonInternal>

  _reason?: Array<CommonInternal>
  _history: Array<HistoryChange>

  readonly name: string
  get(): unknown
  peek(): unknown
  subscribe(listner: Listner): UnSubscribe
}
export interface IState extends CommonInternal {
  set(value: unknown): void
}
export type NodeType = 'state' | 'list' | 'async' | 'computed'

export interface IList extends CommonInternal {
  currentValue: Array<unknown>
  prevValue: Array<unknown>
  set(value: Array<unknown>): void
}

export interface IComputed extends CommonInternal {
  compute: SetterFunc
  computeValue(): void
  subscribeState(listner: Listner): UnSubscribe
}
export interface IAsync extends CommonInternal {
  /**
   * Params
   */
  undefinedOnError: boolean
  strategy: Strategy
  maxWait: number
  customDeps: Array<CommonInternal>

  _isStarted: boolean
  _timeRequestStart: number
  _frameId: number
  _fn: RequestFn<unknown>
  _controller: AbortController | undefined

  isMaxWait(): boolean
  onDepsChange(): void
  set(value: unknown): void
  start(): void
  stop(): void
  then(onFulfilled: any): void

  isPending: State<boolean>
  error: State<Error | undefined>
  status: Computed<AsyncStatus>
}

export type Listner = {
  (value: unknown): void
}

export type Strategy = 'last-win' // | 'fist-win' | 'first&last-win'

export type AsyncStatus = 'indle' | 'pause' | 'pending' | 'error'

export type RequestFn<TResponse> = (controller: AbortController) => Promise<TResponse>
