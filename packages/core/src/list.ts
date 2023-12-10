/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Options, PublicList} from './types/index.js'
import {createPublic} from './utils.js'
import {StateX} from './state.js'

export const list = <T extends Array<unknown>>(value: T, options?: Options) => {
  const statex = new StateX(value, options)
  const fn = createPublic(statex)
  const get = () => statex.get() as T

  Object.defineProperty(fn, 'push', {
    value: (...args: Array<unknown>) => {
      statex.set([...get(), ...args])
      return get().length
    },
    writable: false,
  })

  Object.defineProperty(fn, 'unshift', {
    value: (...args: Array<unknown>) => {
      statex.set([...args, ...get()])
      return get().length
    },
    writable: false,
  })

  Object.defineProperty(fn, 'pop', {
    value: () => {
      const res = get()
      const lastValue = res[res.length - 1]

      statex.set(res.slice(0, res.length - 1))
      return lastValue
    },
    writable: false,
  })

  Object.defineProperty(fn, 'shift', {
    value: () => {
      const res = get()
      const firstValue = res[0]
      statex.set(res.slice(1))
      return firstValue
    },
    writable: false,
  })

  Object.defineProperty(fn, 'at', {
    value: (position: number) => {
      const res = get()
      const length = res.length
      if (position < 0) {
        return res[length + position]
      }
      return res[position]
    },
    writable: false,
  })

  Object.defineProperty(fn, 'sort', {
    value: (fn?: (a: T[number], b: T[number]) => number) => {
      const res = get()
      const sorted = res.slice().sort(fn)
      statex.set(sorted)
      return sorted
    },
    writable: false,
  })

  return fn as PublicList<T>
}
