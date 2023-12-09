import type {CommonInternal, Func, StateVariants, ComputedInternal} from './types/types.js'
const names = new Set()

const defaultName = 'Unnamed state'

export const getName = (name?: string): string => {
  if (name && names.has(name)) {
    console.error(`Name ${name} already used! Replaced to undefined`)
    return defaultName
  }
  if (name) {
    return name
  }
  return defaultName
}

export const getComputedState = (state: CommonInternal | ComputedInternal): ComputedInternal | undefined => {
  if ('reducer' in state) {
    return state
  }
}

export const getHistoryValue = (state: StateVariants): unknown => {
  return state._history[state._historyCursor]
}

export const assert = (condtion: boolean, msg: string) => {
  if (condtion) {
    throw new Error(msg)
  }
}

export const isFunction = (v: unknown): v is Func => {
  return typeof v === 'function'
}

export const cancelFrame = globalThis.cancelAnimationFrame ?? clearTimeout
export const startFrame = globalThis.requestAnimationFrame ?? setTimeout
