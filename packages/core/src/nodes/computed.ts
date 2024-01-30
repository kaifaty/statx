/* eslint-disable @typescript-eslint/no-explicit-any */

import {assert, getNewFnWithName, isFunction} from '../utils'
import type {Computed, Nullable, StateType} from '../types/types'
import {Peek, Subscribe, nonce, status, GetComputedValue, SubscribeComputed} from '../helpers'

type Res<T, S extends StatlessFunc<T>> = T extends -1 ? ReturnType<S> : T

export type StatlessFunc<T> = (v: T) => T
export type GetStatlessFunc<T, S extends StatlessFunc<T>> = StatlessFunc<Res<T, S>>
export type ComputedInternalOptions<T, S extends StatlessFunc<T>> = {
  name?: string
  initial?: Res<T, S>
}

const ComputeProto = Object.create(null)

ComputeProto.get = GetComputedValue
ComputeProto.peek = Peek
ComputeProto.subscribe = SubscribeComputed
ComputeProto.subscribeState = Subscribe

export const computed = <
  T extends StateType = -1,
  S extends StatlessFunc<T> = StatlessFunc<T>,
  O extends Nullable<ComputedInternalOptions<T, S>> = Nullable<ComputedInternalOptions<T, S>>,
>(
  value: GetStatlessFunc<T, S>,
  options?: O,
): Computed<T> => {
  assert(!isFunction(value), 'In computed must be functions only')
  const id = nonce.get()
  const Computed = getNewFnWithName(options, 'computed_' + id)

  Object.setPrototypeOf(Computed, ComputeProto)
  status.initStatus(id, Computed, 'computed')

  Computed.initial = options?.initial
  Computed.compute = value

  return Computed as any as Computed<T>
}
