/* eslint-disable @typescript-eslint/no-explicit-any */
import type {State} from '@statx/core'

type CachedData = Map<unknown, unknown>

const cacheWeak = new WeakMap<State<any>, CachedData>()

const getCache = (st: State<any>) => {
  const cache = cacheWeak.get(st)
  if (cache) {
    return cache
  }
  const newCache = new Map()
  cacheWeak.set(st, newCache)
  return newCache
}

export const cachedState = <T, D, R>(st: State<T>, func: (currentValue: T, data: D) => R) => {
  const cache = getCache(st)
  const unsub = st.subscribe(() => {
    cache.clear()
  })

  return {
    call: (data: D): R => {
      const calced = cache.get(data)

      if (calced) {
        return calced
      }

      const result = func(st(), data)
      cache.set(data, result)

      return result
    },
    destroy: () => {
      cache.clear()
      unsub()
      cacheWeak.delete(st)
    },
  }
}
