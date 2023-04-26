import {useSyncExternalStore} from 'react'
import type {Common, StateType} from '@statx/core'

export const useStatx = <T extends StateType>(state: Common<T>) => {
  return useSyncExternalStore(state.subscribe, state)
}
