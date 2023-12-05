/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Options, PublicList} from './types/index.js'
import {createPublic} from './common.js'
import {StateX} from './state.js'

export const list = <T extends Array<unknown>>(value: T, options?: Options) => {
  const statex = new StateX(value, options)
  const fn = createPublic(statex)
  const getValue = () => statex.getValue() as T

  Object.defineProperty(fn, 'push', {
    value: (...args: Array<unknown>) => {
      statex.setValue([...getValue(), ...args])
      return getValue().length
    },
    writable: false,
  })

  Object.defineProperty(fn, 'unshift', {
    value: (...args: Array<unknown>) => {
      statex.setValue([...args, ...getValue()])
      return getValue().length
    },
    writable: false,
  })

  Object.defineProperty(fn, 'pop', {
    value: () => {
      const res = getValue()
      const lastValue = res[res.length - 1]

      statex.setValue(res.slice(0, res.length - 2))
      return lastValue
    },
    writable: false,
  })

  Object.defineProperty(fn, 'shift', {
    value: () => {
      const res = getValue()
      const firstValue = res[0]
      statex.setValue(res.slice(1))
      return firstValue
    },
    writable: false,
  })

  Object.defineProperty(fn, 'at', {
    value: (position: number) => {
      const res = getValue()
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
      const res = getValue()
      const sorted = res.slice().sort(fn)
      statex.setValue(sorted)
      return sorted
    },
    writable: false,
  })

  return fn as PublicList<T>
}
