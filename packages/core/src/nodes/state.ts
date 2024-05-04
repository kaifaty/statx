/* eslint-disable @typescript-eslint/no-explicit-any */

import {assert, getNewFnWithName, isFunction} from '../helpers/utils'
import type {Options, State, StateType} from '../types/types'
import type {IState} from '../helpers'
import {Peek, Subscribe, nonce, status} from '../helpers'
import {GetStateValue, SetValue} from './proto-state'

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
  status.initStatus(id, State, 'state')

  State.set(value)

  return State as any as State<T>
}
