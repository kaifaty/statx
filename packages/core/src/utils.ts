/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Func} from './types/types.js'
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

export const getHistoryValue = (state: any): unknown => {
  return state.currentValue
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
export const onEach = <T>(data: Record<any, any>, cb: (value: T) => void) => {
  for (const key in data) {
    cb(data[key])
  }
}
