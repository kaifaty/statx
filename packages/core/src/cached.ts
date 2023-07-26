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

export const cachedState = <T>(st: State<T>, func: (currentValue: T, data: T) => T) => {
  const cache = getCache(st)
  const unsub = st.subscribe(() => {
    cache.clear()
  })

  return {
    call: <K>(data: K) => {
      const calced = cache.get(data)

      if (calced) {
        return calced
      }

      const result = func(st(), data as any)
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
