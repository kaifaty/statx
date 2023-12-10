import type {ComputedX} from './computed.js'
import type {StateX} from './state.js'
import type {CommonInternal, Func, StateVariants, ComputedInternal, Listner} from './types/types.js'
const names = new Set()

const defaultName = 'Unnamed state'

const defaultProps = {
  writable: false,
  configurable: false,
}

export const createPublic = (internal: ComputedX | StateX) => {
  const Statx = function () {
    return internal.get()
  }

  Object.defineProperty(Statx, 'name', {
    value: internal.name,
    ...defaultProps,
  })
  Object.defineProperty(Statx, '_internal', {
    value: internal,
    ...defaultProps,
  })
  Object.defineProperty(Statx, 'subscribe', {
    value: (listner: Listner) => internal.subscribe(listner),
    ...defaultProps,
  })
  Object.defineProperty(Statx, 'peek', {
    get() {
      return internal.peek
    },
    configurable: false,
  })

  if ('set' in internal) {
    Object.defineProperty(Statx, 'set', {
      value: (value: unknown) => internal.set(value),
      ...defaultProps,
    })
  }

  return Statx
}

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
