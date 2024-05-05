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
  hasParentUpdate: number
  historyCursor: number
  computing: number
  async: number
  invalidated?: number
}

export interface INode {
  next?: INode
  prev?: INode
  value: CommonInternal | ListenerInternal
  type: number
}

export interface ILinkedList {
  head?: INode
  tail?: INode
  length: number
  push(value: CommonInternal | ListenerInternal, type: number): ILinkedList
  remove(node: INode): ILinkedList
  find(value: CommonInternal | ListenerInternal): INode | undefined
}

//[0, listener, 1, child, 2, parent]
export interface CommonInternal extends SettableStatus {
  deps: ILinkedList
  initial?: unknown
  currentValue: unknown
  prevValue: unknown
  customDeps?: Array<CommonInternal>

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
;[].splice
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
