/* eslint-disable @typescript-eslint/no-explicit-any */
import {Computed, SetterFunc, State, UnSubscribe} from '../types'
export type HistoryChange = {
  reason: 'outside' | 'calc'
  changer: Array<CommonInternal> | undefined
  value: unknown
  ts: number
}

export interface CommonInternal {
  currentValue: unknown
  prevValue: unknown
  _reason?: Array<CommonInternal>
  _type: number
  _customDeps?: Array<CommonInternal>

  _history: Array<HistoryChange>
  _historyCursor: number
  _listeners: Set<Listner | IComputed | IAsync>
  _id: number
  _isComputing: boolean
  readonly name: string
  get(): unknown
  initial?: unknown
  peek(): unknown
  subscribe(listner: Listner): UnSubscribe
}
export interface IState extends CommonInternal {
  set(value: unknown): void
}

export interface IList extends CommonInternal {
  currentValue: Array<unknown>
  prevValue: Array<unknown>
  set(value: Array<unknown>): void
}

export interface IComputed extends CommonInternal {
  _hasParentUpdates: boolean
  reducer: SetterFunc
  computeValue(): void
  subscribeState(listner: Listner): UnSubscribe
}
export interface IAsync extends CommonInternal {
  _hasParentUpdates: boolean
  _isStarted: boolean
  _customDeps: Array<CommonInternal>
  _timeRequestStart: number
  _maxWait: number
  _frameId: number
  _strategy: Strategy
  _fn: RequestFn<unknown>
  _controller: AbortController | undefined
  _undefinedOnError: boolean

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
  base: CommonInternal
  source?: CommonInternal
  subscriber?: string
  willNotify: boolean
}

export type Strategy = 'last-win' // | 'fist-win' | 'first&last-win'

export type AsyncStatus = 'indle' | 'pause' | 'pending' | 'error'

export type RequestFn<TResponse> = (controller: AbortController) => Promise<TResponse>
