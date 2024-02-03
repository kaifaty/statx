/* eslint-disable @typescript-eslint/no-explicit-any */
import {status} from './helpers'
import {CommonInternal, IAsync, IComputed, Listener} from './helpers/type.js'
import type {Func, Options} from './types/types.js'
const names = new Set()

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

export const assert = (condition: boolean, msg: string) => {
  if (condition) {
    throw new Error(msg)
  }
}

export const isFunction = (v: unknown): v is Func => {
  return typeof v === 'function'
}

export const isStatxFn = (v: unknown): v is CommonInternal => {
  return typeof v === 'function' && Object.hasOwn(v, '_id') && Object.hasOwn(v, 'status')
}

export function isState(v: unknown): v is IComputed {
  return isStatxFn(v) && status.getNodeType(v) === 'state'
}

export function isComputed(v: unknown): v is IComputed {
  return isStatxFn(v) && status.getNodeType(v) === 'computed'
}
export function isList(v: unknown): v is IComputed {
  return isStatxFn(v) && status.getNodeType(v) === 'list'
}

export function isAsyncComputed(v: unknown): v is IAsync {
  return isStatxFn(v) && status.getNodeType(v) === 'async'
}

export function isListener(v: unknown): v is Listener {
  return typeof v === 'function' && 'base' in v
}

export const getNewFnWithName = (options?: Options, defaultName?: string) => {
  const name = getName(options?.name, defaultName)
  //@ts-ignore
  function Node() {
    //@ts-ignore
    return Node.get()
  }
  Object.defineProperty(Node, 'name', {
    value: name,
  })
  return Node as any
}
