import {CommonInternal} from 'src/index.js'
import {getHistoryValue, isFunction, pushHistory} from './utils.js'
import {getValueOfSetterFunction} from './get-value-of-setter.js'
import {notifySubscribers} from './notify-subscribers.js'
import {invalidateSubtree} from './invalidate-subtree.js'

export const setValue = (state: CommonInternal, value: unknown): void => {
  const newValue = isFunction(value) ? getValueOfSetterFunction(state, value) : value

  if (newValue === getHistoryValue(state)) {
    return
  }
  pushHistory(state, newValue)
  invalidateSubtree(state)
  notifySubscribers()
}
