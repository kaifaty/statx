import type {Action, ActionOptions} from './types/index.js'
import {getName} from './utils/get-name.js'

let isActionNow = false

/**
 * Action state
 * @param value - Action function
 * @param name
 */
export const action = <T extends unknown[]>(
  value: (...args: T) => void,
  options?: ActionOptions,
): Action<T> => {
  return {
    run: (...args: T) => {
      isActionNow = true
      value(...args)
      isActionNow = false
      return this
    },
    name: getName(options?.name),
    onAction: options?.onAction,
  }
}
