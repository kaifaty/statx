import type {IState} from './type'
import {isFunction} from '../utils'
import {getRecording} from './proto-base'

export function SetValue(this: IState, value: unknown) {
  const newValue = isFunction(value) ? value(this.peek()) : value
  if (newValue === this.peek()) {
    return
  }
  this.pushHistory(newValue)
  this.invalidateSubtree()
  this.notifySubscribers()
}

export function GetStateValue(this: IState) {
  this.updateDeps()
  getRecording()?.add(this)
  return this.peek()
}
