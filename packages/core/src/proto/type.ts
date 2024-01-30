/* eslint-disable @typescript-eslint/no-explicit-any */
import {Computed, SetterFunc, State, UnSubscribe} from '../types'
export type HistoryChange = {
  reason: 'outside' | 'calc'
  changer: Array<CommonInternal> | undefined
  value: unknown
  ts: number
}

export type MapType = 'parents' | 'children' | 'listeners'

// type: {length: 3, defaultValue: 1},
// hasParentUpdate: {length: 1, defaultValue: 0},
// parentsLen: {length: 5, defaultValue: 0},
// childrenLen: {length: 5, defaultValue: 0},
// listeners: {length: 9, defaultValue: 0},
// historyCursor: {length: 5, defaultValue: 0},
// computing: {length: 1, defaultValue: 0},
// async: {length: 1, defaultValue: 1},

export interface CommonInternal {
  currentValue: unknown
  prevValue: unknown
  customDeps?: Array<CommonInternal>
  type: number
  hasParentUpdate: number
  parentsLen: number
  childrenLen: number
  listeners: number
  historyCursor: number
  computing: number
  async: number

  _reason?: Array<CommonInternal>
  _history: Array<HistoryChange>
  _id: number
  //_isComputing: boolean
  readonly name: string
  get(): unknown
  initial?: unknown
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
  _hasParentUpdates: boolean
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

  _hasParentUpdates: boolean
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
  base: Array<CommonInternal> | CommonInternal
  source?: CommonInternal
  subscriber?: string
}

export type Strategy = 'last-win' // | 'fist-win' | 'first&last-win'

export type AsyncStatus = 'indle' | 'pause' | 'pending' | 'error'

export type RequestFn<TResponse> = (controller: AbortController) => Promise<TResponse>
