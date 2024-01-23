/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Action, ActionOptions} from './types/index.js'
import {getName} from './utils.js'

export const action = <T extends unknown[]>(
  value: (...args: T) => void,
  options?: ActionOptions,
): Action<T> => {
  return {
    run: (...args: T) => {
      //isActionNow = true
      value(...args)
      //isActionNow = false
      return this
    },
    name: getName(options?.name ?? 'action' + Date.now()),
  }
}
