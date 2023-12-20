import type {IState} from './type'
import {isFunction} from '../utils'
import {pushHistory, invalidateSubtree, notifySubscribers, updateDeps, getRequester} from './proto-base'

export function SetValue(this: IState, value: unknown) {
  const newValue = isFunction(value) ? value(this.currentValue) : value
  if (newValue === this.currentValue) {
    return
  }
  // console.log('set value', value)
  pushHistory(this, newValue)
  invalidateSubtree(this)
  notifySubscribers()
}

export function GetStateValue(this: IState) {
  updateDeps(this)
  const requester = getRequester()
  if (requester) {
    this._listeners.add(requester)
  }
  return this.currentValue
}
