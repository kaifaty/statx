/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Options, PublicList} from './types/index.js'
import {createPublic} from './common.js'
import {StateX} from './state.js'

class List<T extends Array<unknown>> extends StateX {
  push(...args: Array<unknown>) {
    const data = [...(this.peek as Array<unknown>), ...args]
    this.set(data)
    return data.length
  }
  unshift(...args: Array<unknown>) {
    const data = [...args, ...(this.peek as Array<unknown>)]
    this.set(data)
    return data.length
  }
  pop() {
    const res = this.peek as Array<unknown>

    this.set(res.slice(0, res.length - 1))
    return res[res.length - 1]
  }
  shift() {
    const res = this.peek as Array<unknown>

    this.set(res.slice(1))
    return res[0]
  }
  at(position: number) {
    const res = this.getValue() as Array<unknown>
    const length = res.length
    if (position < 0) {
      return res[length + position]
    }

    return res[position]
  }
  sort(fn?: (a: T[number], b: T[number]) => number) {
    const res = this.getValue() as Array<unknown>
    const sorted = res.slice().sort(fn)
    this.set(sorted)

    return sorted
  }
}

export const list = <T extends Array<unknown>>(value: T, options?: Options) => {
  const statex = new List<T>(value, options)

  return createPublic(statex) as PublicList<T>
}
