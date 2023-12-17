/* eslint-disable @typescript-eslint/no-explicit-any */

import {assert, getName, isFunction} from './utils'
import type {Listner, Options, State, StateType} from './types/types'
import {Peek, Subscribe, getNounce} from './proto/proto-base'
import {GetStateValue, SetValue} from './proto/proto-state'

export const StateProto = Object.create(null)

StateProto.set = SetValue
StateProto.get = GetStateValue
StateProto.peek = Peek
StateProto.subscribe = Subscribe

export function state<T extends StateType = StateType>(value: T, options?: Options): State<T> {
  assert(isFunction(value), 'Function not allowed in state')

  //@ts-ignore
  const State = () => State.get()

  Object.setPrototypeOf(State, StateProto)

  State._childs = Object.create(null)
  State._parents = Object.create(null)
  State._id = getNounce()
  State._subscribes = [] as Array<Listner>

  Object.defineProperty(State, 'name', {
    value: getName(options?.name),
    configurable: false,
    writable: false,
  })

  //@ts-ignore
  State.set(value)

  return State as any as State<T>
}

export const isStateType = (v: unknown): v is State<unknown> => {
  return typeof v === 'function' && 'set' in v && '_id' in v
}
