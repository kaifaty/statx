/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Computed, SetterFunc, State, UnSubscribe} from '../types'
export type HistoryChange = {
  reason: CommonInternal['reason']
  value: unknown
  ts: number
}

export type StatusKey = keyof SettableStatus

export interface SettableStatus {
  id: number
  type: number
  historyCursor: number
  computing: number
  async: number
  invalidated?: number
}

export interface INode<T> {
  next?: INode<T>
  prev?: INode<T>
  value: T
  type: number
}

export interface ILinkedList<T> {
  head?: INode<T>
  tail?: INode<T>
  length: number
  push(value: T, type: number): ILinkedList<T>
  remove(node: INode<T>): ILinkedList<T>
  find(value: T): INode<T> | undefined
  clear(): void
}

export interface CommonInternal extends SettableStatus {
  listenersCount: number
  deps: ILinkedList<CommonInternal | ListenerInternal>
  parents: ILinkedList<CommonInternal>

  initial?: unknown
  currentValue: unknown
  prevValue: unknown
  customDeps?: Array<CommonInternal>

  needRecompute: number | undefined
  compute?: SetterFunc
  reason?: CommonInternal | 'setValue' | 'asyncCalc' | string
  history: Array<HistoryChange>

  readonly name: string
  get(): unknown
  peek(): unknown
  subscribe(listener: ListenerInternal): UnSubscribe
  subscribeState?(listener: ListenerInternal): UnSubscribe
}
export interface IState extends CommonInternal {
  set(value: unknown): void
}
export type NodeType = 'state' | 'list' | 'async' | 'computed'
export type DependencyType = 'listener' | 'child' | 'parent'

export interface IList extends CommonInternal {
  currentValue: Array<IState>
  prevValue: Array<IState> | undefined
  prevLen: number
  set(value: Array<unknown>): void
  maps?: Array<{data: Array<unknown>; fn: (valueState: CommonInternal) => unknown}>
  splice(i: number, deleteCount?: number): Array<IState>
}

export interface IComputed extends CommonInternal {
  compute: SetterFunc
  computeValue(): void
  subscribeState(listener: ListenerInternal, subscriberName?: string): UnSubscribe
}

export interface IAsync extends CommonInternal {
  /**
   * Params
   */
  undefinedOnError: boolean
  strategy: Strategy
  strategyDelay: number
  maxWait: number
  customDeps: Array<CommonInternal>

  _isStarted: boolean
  _timeRequestStart: number
  _frameId: number
  _fn: RequestFn<unknown>
  _controller: AbortController | undefined

  isMaxWait(): boolean
  onDepsChange(reason: string): void
  set(value: unknown): void
  start(): void
  stop(): void
  then(onFulfilled: any): void

  isPending: State<boolean> & {asyncDep: true}
  error: State<Error | undefined> & {asyncDep: true}
  status: Computed<AsyncStatus> & {asyncDep: true}
}

export type ListenerInternal = {
  (value: unknown): void
  subscriber?: string
}

export type Strategy = 'last-win' // | 'fist-win' | 'first&last-win'

export type AsyncStatus = 'idle' | 'pause' | 'pending' | 'error'

export type RequestFn<TResponse> = (
  controller: AbortController,
  prevValue: TResponse | undefined,
) => Promise<TResponse>
