/* eslint-disable @typescript-eslint/no-explicit-any */

import {assert, getNewFnWithName, getNonce, isFunction, stateTypes} from './utils'
import type {Options, State, StateType} from './types/types'
import {Peek, Subscribe, GetStateValue, SetValue} from './proto'
import {addState} from './states-map'
import {IState} from './proto/type'

export const StateProto = Object.create(null)

StateProto.set = SetValue
StateProto.get = GetStateValue
StateProto.peek = Peek
StateProto.subscribe = Subscribe

export function state<T extends StateType = StateType>(value: T, options?: Options): State<T> {
  assert(isFunction(value), 'Function not allowed in state')

  const id = getNonce()
  const State: IState = getNewFnWithName(options, 'state_' + id)

  Object.setPrototypeOf(State, StateProto)

  State._listeners = new Set()
  State._id = id
  State._type = stateTypes.state

  addState(State)

  State.set(value)

  return State as any as State<T>
}
