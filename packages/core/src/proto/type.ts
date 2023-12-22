/* eslint-disable @typescript-eslint/no-explicit-any */
import {SetterFunc, UnSubscribe} from '../types'

export interface CommonInternal {
  currentValue: unknown
  prevValue: unknown

  // _history: unknown[]
  // _historyCursor: number

  _listeners: Set<Listner | IComputed>
  _id: number
  _computed?: true
  cause?: string
  _name: string
  get(): unknown
  initial?: unknown
  isComputing: boolean
  peek(): unknown
}

export type Listner = {
  (value: unknown): void
  base: CommonInternal
  willNotify: boolean
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
