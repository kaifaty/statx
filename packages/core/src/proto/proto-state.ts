import type {IState} from './type'
import {isFunction} from '../utils'
import {events} from '../events'
import {
  pushHistory,
  invalidateSubtree,
  notifySubscribers,
  updateDeps,
  getRequester,
  readStates,
  getLogsEnabled,
} from './proto-base'

export function SetValue(this: IState, value: unknown) {
  const newValue = isFunction(value) ? value(this.currentValue) : value
  if (newValue === this.currentValue) {
    return
  }
  pushHistory(this, newValue, 'outside')
  invalidateSubtree(this)
  notifySubscribers()

  if (getLogsEnabled()) {
    events.dispatchValueUpdate(this)
  }
}

export function GetStateValue(this: IState) {
  updateDeps(this)
  const requester = getRequester()
  readStates.push(this)
  if (requester) {
    this._listeners.add(requester)
  }
  return this.currentValue
}
