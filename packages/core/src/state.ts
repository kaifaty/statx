/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Options, State, StateType} from './types/index.js'
import {assert, isFunction} from './utils.js'
import {Common, createPublic} from './common.js'

export class StateX extends Common {
  constructor(value: unknown, options?: Options) {
    super(options)
    this.set(value)
  }
  set(value: unknown): void {
    const newValue = isFunction(value) ? value(this.peek) : value

    if (newValue === this.peek) {
      return
    }
    this._pushHistory(newValue)
    this._invalidateSubtree()
    this._notifySubscribers()
  }
}

export function state<T extends StateType = StateType>(value: T, options?: Options): State<T> {
  assert(isFunction(value), 'Function not allowed in state')
  const statex = new StateX(value, options)

  return createPublic(statex) as State<T>
}
