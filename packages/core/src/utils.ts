/* eslint-disable @typescript-eslint/no-explicit-any */
import {CommonInternal, IAsync, IComputed, Listner} from './proto/type.js'
import type {Func, Options} from './types/types.js'
const names = new Set()
let nonce = 0

export const getNonce = () => nonce++

export const getName = (name?: string, defaultName = 'withoutName'): string => {
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

export const isStatxFn = (v: unknown): v is CommonInternal => {
  return typeof v === 'function' && Object.hasOwn(v, '_id') && Object.hasOwn(v, '_type')
}

export function isState(v: unknown): v is IComputed {
  return typeof v === 'function' && (v as any)._type === stateTypes.state
}

export function isComputed(v: unknown): v is IComputed {
  return typeof v === 'function' && (v as any)._type === stateTypes.computed
}
export function isList(v: unknown): v is IComputed {
  return typeof v === 'function' && (v as any)._type === stateTypes.list
}

export function isAsyncComputed(v: unknown): v is IAsync {
  return typeof v === 'function' && (v as any)._type === stateTypes.async
}

export function isListener(v: unknown): v is Listner {
  return typeof v === 'function' && 'base' in v
}

export const onEach = <T>(data: Record<any, any>, cb: (value: T) => void) => {
  for (const key in data) {
    cb(data[key])
  }
}

export const getNewFnWithName = (options?: Options, defaultName?: string) => {
  const name = getName(options?.name, defaultName)
  const obj = {
    //@ts-ignore
    [name]: () => obj[name].get(),
  } as any
  return obj[name]
}

export const stateTypes = {
  state: 0,
  list: 1,
  async: 2,
  computed: 3,
} as const

export const getNodeType = (base: CommonInternal): keyof typeof stateTypes => {
  const namedType = Object.entries(stateTypes).find((item) => item[1] === base._type)?.[0] as any
  if (!namedType) {
    console.error(base)
    throw new Error('Unknown type:' + base._type + ' name: ' + base.name)
  }
  return namedType
}
