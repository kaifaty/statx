/* eslint-disable @typescript-eslint/no-explicit-any */

import {assert, getNewFnWithName, isFunction} from './utils'
import type {Options, State, StateType} from './types/types'
import {Peek, Subscribe, nonce, GetStateValue, IState, status, SetValue} from './proto'
import {addState} from './states-map'

export const StateProto = Object.create(null)

StateProto.set = SetValue
StateProto.get = GetStateValue
StateProto.peek = Peek
StateProto.subscribe = Subscribe

export function state<T extends StateType = StateType>(value: T, options?: Options): State<T> {
  assert(isFunction(value), 'Function not allowed in state')

  const id = nonce.get()
  const State: IState = getNewFnWithName(options, 'state_' + id)

  Object.setPrototypeOf(State, StateProto)

  State.state = status.initStatus('state')

  State._id = id

  addState(State)

  State.set(value)

  return State as any as State<T>
}
