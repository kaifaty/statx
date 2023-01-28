import {subscribe, flushStates, startRecord, CommonInternal} from '@statx/core'

const DEFAULT_OPTIONS: Options = {
  interval: 0,
  notify: ['data', 'isFetching', 'isLoading'],
  cacheLocal: false,
}

type AsyncFucn<T> = () => Promise<T>

type NotifyOption = 'isFetching' | 'isLoading' | 'data'

interface Options {
  interval?: number
  notify?: Array<NotifyOption>
  cacheLocal?: false | {name: string}
}
type Suspense<T> = {
  readonly data: T
  isFetching: boolean
  isLoading: boolean
}

const PREFIX = 'suspense-'

export type SuspenseState<T> = Suspense<T> & {
  (): void
  subscribe(listener: (data: Suspense<T>) => void): void
}

const getFromStorage = <T>(name: string): T | undefined => {
  const data = localStorage.getItem(PREFIX + name)
  if (data) {
    try {
      return JSON.parse(data)
    } catch (e) {
      console.error((e as Error).message)
    }
  }
}

export const suspenseState = <T extends unknown = unknown>(
  request: AsyncFucn<T>,
  options?: Options,
): SuspenseState<T> => {
  const statesUnsubs = new Set<() => void>()
  const subs = new Set<(data: Suspense<T>) => void>()
  const interval = options?.interval ?? DEFAULT_OPTIONS.interval
  const notifyOption = options?.notify ?? DEFAULT_OPTIONS.notify
  const cacheLocalName = options?.cacheLocal && options?.cacheLocal.name

  let data: T = cacheLocalName ? getFromStorage<T>(cacheLocalName) : undefined
  let isLoading = true
  let isFetching = true
  let isRequsted = false

  const res = {
    get isLoading() {
      return isLoading
    },
    get isFetching() {
      return isFetching
    },
    get data() {
      return data
    },
  }

  const subscribe2States = (states: Set<CommonInternal>) => {
    queueMicrotask(() => {
      states.forEach((state) => {
        statesUnsubs.add(subscribe(state, stateListener))
      })
    })
  }

  const unsubscribe = () => {
    statesUnsubs.forEach((f) => f())
    statesUnsubs.clear()
  }

  const stateListener = () => {
    if (isRequsted) {
      return
    }
    isRequsted = true
    queueMicrotask(() => {
      makeRequest()
      isRequsted = false
    })
  }

  const notifyListners = () => {
    subs.forEach((listener) => {
      listener(res)
    })
  }

  const makeRequest = () => {
    startRecord()
    isFetching = true

    unsubscribe()
    statesUnsubs.clear()

    if (notifyOption.includes('isFetching')) {
      notifyListners()
    }

    request().then((r) => {
      data = r
      isFetching = false
      isLoading = false
      if (cacheLocalName) {
        localStorage.setItem(PREFIX + cacheLocalName, JSON.stringify(data))
      }

      notifyListners()
    })
    subscribe2States(flushStates())
  }

  makeRequest()

  if (interval) {
    setInterval(() => {
      makeRequest()
    }, interval)
  }
  /**
   * 1. Узнать список зависимых состояний.
   * 2. Подписаться на их изменение
   * 3. Объединять синхронные изменения разных состояний в один запрос
   * 4. Подключить троттлинг
   *
   */

  const f = function () {
    makeRequest()
  }
  Object.defineProperty(f, 'data', {
    get() {
      return data
    },
  })
  Object.defineProperty(f, 'isLoading', {
    get() {
      return isLoading
    },
  })
  Object.defineProperty(f, 'isFetching', {
    get() {
      return isFetching
    },
  })
  f.subscribe = (listner: (data: Suspense<T>) => void) => {
    subs.add(listner)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return f as any
}
