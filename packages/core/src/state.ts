/* eslint-disable @typescript-eslint/no-explicit-any */

import {assert, getName, getNewFnWithName, isFunction} from './utils'
import type {Options, State, StateType} from './types/types'
import {Peek, Subscribe, getNounce} from './proto/proto-base'
import {GetStateValue, SetValue} from './proto/proto-state'

export const StateProto = Object.create(null)

StateProto.set = SetValue
StateProto.get = GetStateValue
StateProto.peek = Peek
StateProto.subscribe = Subscribe

export function state<T extends StateType = StateType>(value: T, options?: Options): State<T> {
  assert(isFunction(value), 'Function not allowed in state')

  const State = getNewFnWithName(options)

  Object.setPrototypeOf(State, StateProto)

  State._listeners = new Set()
  State._id = getNounce()
  State._name = getName(options?.name)

  State.set(value)

  return State as any as State<T>
}

export const isStateType = (v: unknown): v is State<unknown> => {
  return typeof v === 'function' && 'set' in v && '_id' in v
}
