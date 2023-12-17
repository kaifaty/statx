/* eslint-disable @typescript-eslint/no-explicit-any */
import {Listner, SetterFunc, UnSubscribe} from '../types'

export interface CommonInternal {
  _childs: Record<number, CommonInternal>
  _hasParentUpdates: boolean | undefined

  currentValue: unknown
  prevValue: unknown

  // _history: unknown[]
  // _historyCursor: number

  _id: number
  _parents: Record<number, CommonInternal>
  _subscribes: Array<Listner>

  cause?: string
  get(): unknown
  initial?: unknown
  isComputing: boolean
  name: string
  peek(): unknown
}

export interface Base extends CommonInternal {
  invalidateSubtree(): void
  isDontNeedRecalc(): boolean
  notifySubscribers(): void
  peek(): unknown
  pushHistory(value: unknown): void
  subscribe(listner: Listner): UnSubscribe
  updateDeps(): void
}

export interface IState extends Base {
  set(value: unknown): void
}

export interface IComputed extends Base {
  reducer: SetterFunc
  computeValue(): void
  subscribeState(listner: Listner): UnSubscribe
}
