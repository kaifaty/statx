import type {CommonInternal, Func, StateVariants, ComputedInternal, HistoryInternal} from '../types/types.js'

export const getComputedState = (state: CommonInternal | ComputedInternal): ComputedInternal | undefined => {
  if ('reducer' in state) {
    return state
  }
}

export const getHistoryValue = (state: StateVariants): unknown => {
  return state.history[state.historyCursor]
}

export const assert = (condtion: boolean, msg: string) => {
  if (condtion) {
    throw new Error(msg)
  }
}

export const pushHistory = <T extends HistoryInternal>(state: T, value: unknown) => {
  const cursorHistory = state.historyCursor
  state.historyCursor = (cursorHistory + 1) % state.history.length
  state.history[state.historyCursor] = value
}

export const isFunction = (v: unknown): v is Func => {
  return typeof v === 'function'
}
