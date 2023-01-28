import {useSyncExternalStore} from 'react'
import type {Common, StateType} from '@statx/core'

export const useState = <T extends StateType>(state: Common<T>) => {
  return useSyncExternalStore(state.subscribe, state)
}
