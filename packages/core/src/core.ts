import {
  ComputedInternal,
  Listner,
  StateType,
  Settings,
  StateInternal,
  StateVariants,
  Action,
  Options,
  ComputedInternalOptions,
  Nullable,
  SetValue,
  StatlessFunc,
  GetStatlessFunc,
  HistoryInternal,
  State,
  Computed,
  Func,
  UnSubscribe,
} from './types.js'

let cache = new WeakMap<StateVariants, StateType>()
let isNotifying = false
let isActionNow = false
let recording: Set<StateVariants<StateType>> | undefined

const defaultName = 'Unnamed state'
const names = new Set()
const requesters: ComputedInternal<StateType>[] = []
const states2notify = new Set<StateVariants<StateType>>()
const settings: Settings = {
  historyLength: 5,
}
// <T extends StateType>(state: StateVariants<T>
const getCachValue = <T extends StateType, S = StateVariants<T>>(state: S): T => {
  return cache.get(state as any) as any
}

const setCacheValue = <T extends StateType, S = StateVariants<T>>(state: S, value: T): void => {
  cache.set(state as any, value)
}

const getName = (name?: string): string => {
  if (name && names.has(name)) {
    console.error(`Name ${name} already used! Replaced to undefined`)
    return defaultName
  }
  if (name) {
    return name
  }
  return defaultName
}

export const setSetting = (data: Partial<Settings>) => {
  Object.assign(settings, data)
}

export const setContext = () => {
  cache = new WeakMap<object, StateType>()
}

const isUndefinedState = <T extends StateType>(state: ComputedInternal<T>) => {
  // Loop update
  if (state.isComputing) {
    console.error(`Loops don't allow in reducers. Name: ${state.name ?? 'Unnamed state'}`)
    return true
  }

  return false
}

const getReducer = <T extends StateType>(state: StateVariants<T>) => {
  if ('reducer' in state) {
    return state
  }
}

const isComputed = (state: { reducer?: Func }) => {
  return state.reducer !== undefined
}

const isFunction = (v: unknown): v is Func => {
  return typeof v === 'function'
}

const updateHistory = <T extends HistoryInternal>(state: T, value: unknown) => {
  const cursorHistory = state.historyCursor
  state.history[cursorHistory] = value
  state.historyCursor = (cursorHistory + 1) % state.history.length
}

const notifySubscribers = <T extends StateType>(state: StateVariants<T>) => {
  states2notify.add(state as any)
  state.childs.forEach((s) => states2notify.add(s))
}

const applyUpdates = <T extends StateType>(state: StateVariants<T>, value: T): void => {
  setCacheValue(state, value)
  updateHistory(state, value)

  /**
   * Notify all subtree
   */
  notifySubscribers(state)

  /**
   * Batching of subscribers in microtasks queue
   */
  if (isNotifying === false) {
    isNotifying = true
    queueMicrotask(() => {
      states2notify.forEach((state) => {
        try {
          state.subscribes.forEach((listner) => listner(getValue(state)))
        } catch (e) {
          console.error('Error in subscriber function of:', state.name)
        }
      })
      states2notify.clear()
      isNotifying = false
    })
  }
}

const isDontNeedCacl = <T extends StateType>(state: ComputedInternal<T>, prevState: T): boolean => {
  return state.hasParentUpdates === false && prevState !== undefined
}

const getComputedValue = <T extends StateType>(state: ComputedInternal<T>): T | undefined => {
  try {
    const prevState = getCachValue<T>(state)

    if (isDontNeedCacl(state, prevState)) {
      return prevState
    }

    if (isUndefinedState(state)) {
      return undefined
    }

    requesters.push(state as any)
    state.childs.clear()

    state.isComputing = true
    const value = state.reducer(prevState ?? (state.initial as any))
    state.isComputing = false
    state.hasParentUpdates = false

    applyUpdates(state as any, value)

    return value as any
  } catch (e) {
    state.childs.clear()
    console.error((e as Error).message)
    return undefined
  }
}

const getValue = <T extends StateType>(state: StateVariants<T>): T | undefined => {
  try {
    const reducer = getReducer(state)
    if (reducer) {
      return getComputedValue(reducer)
    }
    const lastRequester = requesters.pop()
    if (lastRequester && !state.childs.has(lastRequester)) {
      state.childs.add(lastRequester)
    }
    return getCachValue<T>(state)
  } finally {
    if (recording) {
      recording.add(state as any)
    }
  }
}

const getValueOfSetterFunction = <T extends StateType>(state: StateVariants<T>, value: (v: T) => T): T => {
  const prevValue = getCachValue<T>(state)
  return value(prevValue)
}

const setValue = <T extends StateType>(state: StateVariants<T>, value: SetValue<T>): void => {
  const nonFuncValue = isFunction(value) ? getValueOfSetterFunction(state, value) : value

  state.childs.forEach((childState) => {
    childState.hasParentUpdates = true
  })

  applyUpdates(state, nonFuncValue)
}

export const startRecord = () => {
  recording = new Set()
}

export const flushStates = () => {
  const data = recording
  recording = undefined
  return data
}

export const subscribe = <
  T extends {
    subscribes: Set<Listner>
    reducer?: Func
  },
>(
  state: T,
  listner: Listner,
): UnSubscribe => {
  /**
   * Если значение стейта ниразу не расчитывалось, его нужно обновить
   * Если подписываемся на вычисляемый стэйт, то нужно узнать всех родителей
   * Родители могут меняться, поэтому после каждого вычисления нужно обновлять зависимости дерева
   */

  if (state.subscribes.has(listner)) {
    return () => ({})
  }

  const reducer = isComputed(state)
  if (reducer) {
    console.log('sub', getComputedValue(state as any))
  }

  state.subscribes.add(listner)

  return () => {
    state.subscribes.delete(listner)
  }
}

const assert = (condtion: boolean, msg: string) => {
  if (condtion) {
    throw new Error(msg)
  }
}
/**
 *
 * @param value - Reducer or value
 * @param name - name of state. For loggin or easy debug
 * @returns State<T>
 */
export function state<T extends StateType = StateType>(value: T, options?: Options): State<T> {
  assert(isFunction(value), 'Function not allowed in state')

  const data: StateInternal<T> = {
    name: getName(options?.name),
    historyCursor: 0,
    history: Array.from({ length: settings.historyLength }),
    childs: new Set(),
    subscribes: new Set(),
  }

  setValue(data, value)

  const f = function () {
    return getValue(data)
  }

  Object.defineProperty(f, 'name', { value: data.name })
  f.subscribe = (listner: Listner) => subscribe(data, listner)
  f.set = (value: T) => setValue(data, value)

  return f
}

export const computed = <
  T extends StateType = -1,
  S extends StatlessFunc = StatlessFunc,
  O extends Nullable<ComputedInternalOptions> = Nullable<ComputedInternalOptions>,
>(
  value: GetStatlessFunc<T, S, O>,
  options?: O,
): Computed<T> => {
  const data: ComputedInternal<T, GetStatlessFunc<T, S, O>> = {
    childs: new Set(),
    hasParentUpdates: true,
    historyCursor: 0,
    history: Array.from({ length: settings.historyLength }),
    initial: options?.initial as ReturnType<typeof value> | undefined,
    isComputing: false,
    reducer: value,
    subscribes: new Set(),
    name: getName(options?.name),
  }

  const f = function () {
    return getValue(data)
  }
  Object.defineProperty(f, 'name', { value: data.name })
  f.subscribe = (listner: Listner) => subscribe(data, listner)
  return f
}

/**
 * ## Action state
 *
 * @param value - Action function
 * @param name
 */
export const action = <T extends unknown[]>(value: (...args: T) => void, name?: string): Action<T> => {
  return {
    run: (...args: T) => {
      isActionNow = true
      value(...args)
      isActionNow = false
      return this
    },
    name: getName(name),
    onAction: undefined,
  }
}
