/* eslint-disable @typescript-eslint/no-explicit-any */

import {assert, isFunction} from '../utils'
import type {Listner, Options, State, StateType} from '../types/types'
import {
  InvalidateSubtree,
  NotifySubscribers,
  Peek,
  PushHistory,
  Subscribe,
  UpdateDeps,
  getNounce,
} from './proto-base'
import {GetStateValue, SetValue} from './proto-state'

const StateProto = Object.create(null)

StateProto.set = SetValue
StateProto.get = GetStateValue
StateProto.peek = Peek
StateProto.subscribe = Subscribe
StateProto.invalidateSubtree = InvalidateSubtree
StateProto.notifySubscribers = NotifySubscribers
StateProto.pushHistory = PushHistory
StateProto.updateDeps = UpdateDeps

export function state<T extends StateType = StateType>(value: T, options?: Options): State<T> {
  assert(isFunction(value), 'Function not allowed in state')

  //@ts-ignore
  const State = () => State.get()

  Object.setPrototypeOf(State, StateProto)

  State._childs = Object.create(null)
  State._id = getNounce()
  State._parents = Object.create(null)
  State._subscribes = [] as Array<Listner>

  Object.defineProperty(State, 'name', {
    value: options?.name ?? 'unknown',
  })

  //@ts-ignore
  State.set(value)

  return State as any as State<T>
}
