/* eslint-disable @typescript-eslint/no-explicit-any */
import {isStatxFn, state, type State} from '@statx/core'
import type {PersistAdapter, PersistOptions, PersistState} from './types'
import {throttle} from '@statx/utils'

const getInitialValue = (value: unknown, adapter: PersistAdapter, name: string) => {
  if (isStatxFn(value)) {
    return (value as any)()
  }

  const existValue = adapter.get(name)

  if (typeof value === 'function') {
    if (adapter.isAsync) {
      return value()
    }
    return existValue ?? value()
  }

  return existValue ?? value
}

const tryGetRestoredValue = (value: unknown, adapter: PersistAdapter, options: PersistOptions<any>) => {
  const initial = getInitialValue(value, adapter, options.name)

  return options.restoreFn?.(initial) ?? initial
}

const applyPersist = async (
  stateValue: State<any>,
  adapter: PersistAdapter,
  options: PersistOptions<any>,
) => {
  try {
    if (adapter.isAsync) {
      const currentValue = adapter.get(options.name)
      const restored = await (currentValue as Promise<unknown>)
      stateValue.set(options.restoreFn?.(restored) ?? restored)
    }
  } finally {
    options.onPersisStateInit?.(stateValue())
  }
}

export const createPersistState = <T>(
  value: unknown,
  adapter: PersistAdapter,
  options: PersistOptions<any>,
): PersistState<T> => {
  let stateValue: State<any>
  let initialValue

  const name = options.name

  if (isStatxFn(value)) {
    initialValue = value.peek()
    stateValue = value as any
  } else {
    initialValue = value
    stateValue = state<unknown>(tryGetRestoredValue(value, adapter, options), {name})
  }

  applyPersist(stateValue, adapter, options)

  const throttleSet = throttle((newValue: unknown) => {
    if (newValue === undefined) {
      adapter.clear(name)
    } else {
      adapter.set(name, newValue)
    }
  }, options.throttle ?? 0)

  const baseSet = stateValue.set.bind(stateValue)

  Object.assign(stateValue, {
    set: (v: unknown) => {
      baseSet(v)
      throttleSet(v)
    },
    clear: () => {
      baseSet(initialValue)
      adapter.clear(name)
    },
  })

  return stateValue as PersistState<T>
}
