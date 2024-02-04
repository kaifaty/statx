/* eslint-disable @typescript-eslint/no-explicit-any */
import {dependencyTypes, stateTypes} from './status'
import {CommonInternal, DependencyType, IAsync, IComputed, Listener} from './type.js'
import type {Func, Options} from '../types/types.js'
const names = new Set()

const dependencyObject = Object.entries(dependencyTypes).reduce<Record<number, DependencyType>>(
  (acc, item) => {
    acc[item[1]] = item[0] as DependencyType
    return acc
  },
  {},
)

export const eachDependency = (
  node: CommonInternal,
  cb: (node: CommonInternal | Listener, type: DependencyType) => void,
) => {
  for (let i = 0; i < node.deps.length; i += 2) {
    cb(node.deps[i] as any, dependencyObject[node.deps[i + 1] as number])
  }
}

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
  return typeof v === 'function' && Object.hasOwn(v, 'id') && Object.hasOwn(v, 'status')
}

export function isState(v: unknown): v is IComputed {
  return isStatxFn(v) && v.type === stateTypes.state
}

export function isComputed(v: unknown): v is IComputed {
  return isStatxFn(v) && v.type === stateTypes.computed
}
export function isList(v: unknown): v is IComputed {
  return isStatxFn(v) && v.type === stateTypes.list
}

export function isAsyncComputed(v: unknown): v is IAsync {
  return isStatxFn(v) && v.type === stateTypes.async
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
