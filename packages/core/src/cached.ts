/* eslint-disable @typescript-eslint/no-explicit-any */
import type {State, UnSubscribe} from './types'

type CachedData = Map<unknown, unknown>

export const cachedState = <T, D, R>(st: State<T>, func: (currentValue: T, data: D) => R) => {
  return new CachedState(st, func)
}

export class CachedState<T, D, R> {
  private static allCache = new WeakMap<State<any>, CachedData>()
  private static getCache(st: State<any>) {
    const cache = this.allCache.get(st)
    if (cache) {
      return cache
    }
    const newCache = new Map()
    this.allCache.set(st, newCache)
    return newCache
  }

  private st: State<T>
  private func: (currentValue: T, data: D) => R
  private cache: CachedData
  private unSub: UnSubscribe

  constructor(st: State<T>, func: (currentValue: T, data: D) => R) {
    this.st = st
    this.func = func
    this.cache = CachedState.getCache(st)
    this.unSub = st.subscribe(() => {
      this.cache.clear()
    })
  }

  destroy = () => {
    this.cache.clear()
    this.unSub()
    CachedState.allCache.delete(this.st)
    //@ts-ignore
    this.st = null
  }

  call = (data: D): R => {
    const calcValue = this.cache.get(data)

    if (calcValue) {
      return calcValue as R
    }

    const result = this.func(this.st(), data)
    this.cache.set(data, result)

    return result
  }
}
