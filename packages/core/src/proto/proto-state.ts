import type {IState, CommonInternal} from './type'
import {isFunction} from '../utils'
import {getRecording, pushHistory, invalidateSubtree, notifySubscribers, updateDeps} from './proto-base'

export function SetValue(this: CommonInternal, value: unknown) {
  const newValue = isFunction(value) ? value(this.currentValue) : value
  if (newValue === this.currentValue) {
    return
  }
  pushHistory(this, newValue)
  invalidateSubtree(this)
  notifySubscribers()
}

export function GetStateValue(this: IState) {
  updateDeps(this)
  getRecording()?.add(this)
  return this.currentValue
}
