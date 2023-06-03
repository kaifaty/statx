import type {StateType} from '@statx/core'
import {throttle} from '@statx/utils'
import {PREFIX, NOT_ALLOWED_TYPES} from '../consts.js'
import {SyncStorage} from '../types.js'

export const localStorageAdapter = <T extends StateType>(
  name: string,
  throttle = 0,
  isSession = false,
): SyncStorage => {
  const storage = isSession ? sessionStorage : localStorage
  return {
    isAsync: false,
    clear() {
      storage.removeItem(PREFIX.localStorage + name)
    },
    get(): T | undefined {
      const v = storage.getItem(PREFIX.localStorage + name)
      if (!v) return undefined
      const data = JSON.parse(v)

      return data.value
    },
    set: throttle(throttle, (value: T) => {
      const type = typeof value
      if (NOT_ALLOWED_TYPES.includes(type)) {
        throw new Error('Type ' + type + ' not allowed')
      }
      storage.setItem(
        PREFIX.localStorage + name,
        JSON.stringify({
          value,
          timestamp: Date.now(),
          version: 1,
        }),
      )
    }),
  }
}
