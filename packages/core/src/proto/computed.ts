/* eslint-disable @typescript-eslint/no-explicit-any */

import {assert, isFunction} from '../utils'
import type {Computed, Listner, Nullable, StateType} from '../types/types'
import {
  InvalidateSubtree,
  IsDontNeedRecalc,
  NotifySubscribers,
  Peek,
  PushHistory,
  UpdateDeps,
  Subscribe,
  getNounce,
} from './proto-base'
import {ComputeValue, GetComputedValue, SubscribeComputed} from './proto-computed'

type Res<T, S extends StatlessFunc<T>> = T extends -1 ? ReturnType<S> : T

export type StatlessFunc<T> = (v: T) => T
export type GetStatlessFunc<T, S extends StatlessFunc<T>> = StatlessFunc<Res<T, S>>
export type ComputedInternalOptions<T, S extends StatlessFunc<T>> = {
  name?: string
  initial?: Res<T, S>
}

const ComputeProto = Object.create(null)

ComputeProto.computeValue = ComputeValue
ComputeProto.get = GetComputedValue
ComputeProto.invalidateSubtree = InvalidateSubtree
ComputeProto.isDontNeedRecalc = IsDontNeedRecalc
ComputeProto.notifySubscribers = NotifySubscribers
ComputeProto.peek = Peek
ComputeProto.pushHistory = PushHistory
ComputeProto.subscribe = SubscribeComputed
ComputeProto.subscribeState = Subscribe
ComputeProto.updateDeps = UpdateDeps

export const computed = <
  T extends StateType = -1,
  S extends StatlessFunc<T> = StatlessFunc<T>,
  O extends Nullable<ComputedInternalOptions<T, S>> = Nullable<ComputedInternalOptions<T, S>>,
>(
  value: GetStatlessFunc<T, S>,
  options?: O,
): Computed<T> => {
  assert(!isFunction(value), 'In computed must be functions only')

  //@ts-ignore
  const Computed = () => Computed.get()

  Object.setPrototypeOf(Computed, ComputeProto)

  Computed._childs = Object.create(null)
  Computed._id = getNounce()
  Computed._parents = Object.create(null)
  Computed._subscribes = [] as Array<Listner>

  Computed.initial = options?.initial
  Computed.isComputing = false
  Computed.reducer = value

  Object.defineProperty(Computed, 'name', {
    value: options?.name ?? 'unknown',
  })

  return Computed as any as Computed<T>
}
