/* eslint-disable @typescript-eslint/no-explicit-any */
import {SetterFunc, UnSubscribe} from '../types'

export interface CommonInternal {
  // _childs: Record<number, CommonInternal>

  currentValue: unknown
  prevValue: unknown

  // _history: unknown[]
  // _historyCursor: number
  // _subscribes: Array<Listner>
  // _parents: Record<number, CommonInternal>

  _listeners: Set<Listner | IComputed>
  _id: number
  _computed?: true

  cause?: string
  get(): unknown
  initial?: unknown
  isComputing: boolean
  name: string
  peek(): unknown
}

export type Listner = {
  (value: unknown): void
  base: CommonInternal
}

export interface Base extends CommonInternal {
  peek(): unknown
  subscribe(listner: Listner): UnSubscribe
}

export interface IState extends Base {
  set(value: unknown): void
}

export interface IList extends Base {
  currentValue: Array<unknown>
  prevValue: Array<unknown>
  set(value: Array<unknown>): void
}

export interface IComputed extends Base {
  _hasParentUpdates: boolean
  reducer: SetterFunc
  computeValue(): void
  subscribeState(listner: Listner): UnSubscribe
}
