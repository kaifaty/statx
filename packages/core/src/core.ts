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
  CommonInternal,
} from './types.js'

let cache = new WeakMap<StateVariants, StateType>()
let isNotifying = false
let isActionNow = false
let recording: Set<StateVariants> | undefined

const defaultName = 'Unnamed state'
const names = new Set()
const requesters: ComputedInternal[] = []
const states2notify = new Set<StateVariants>()
const settings: Settings = {
  historyLength: 5,
}
// <T extends StateType>(state: StateVariants<T>
export const getCachValue = (state: StateVariants): unknown => {
  return cache.get(state)
}

const setCacheValue = (state: StateVariants, value: StateType): void => {
  cache.set(state, value)
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

const isUndefinedState = (state: ComputedInternal) => {
  // Loop update
  if (state.isComputing) {
    console.error(`Loops don't allow in reducers. Name: ${state.name ?? 'Unnamed state'}`)
    return true
  }

  return false
}

const getReducer = (state: CommonInternal | ComputedInternal) => {
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

const isDontNeedCacl = (state: CommonInternal, prevState: unknown): boolean => {
  return state.hasParentUpdates === false && prevState !== undefined
}

const getComputedValue = (state: ComputedInternal): unknown => {
  try {
    const prevState = getCachValue(state)

    if (isDontNeedCacl(state, prevState)) {
      return prevState
    }

    if (isUndefinedState(state)) {
      return undefined
    }

    requesters.push(state as any)

    state.isComputing = true
    const value = state.reducer(prevState ?? (state.initial as any))
    state.isComputing = false
    state.hasParentUpdates = false

    applyUpdates(state as any, value)

    return value as any
  } catch (e) {
    console.error((e as Error).message)
    return undefined
  }
}

const getValue = (state: CommonInternal) => {
  try {
    const lastRequester = requesters.pop()
    if (lastRequester && !state.childs.has(lastRequester)) {
      state.childs.add(lastRequester)
      lastRequester.depends.add(state)
    }
    const reducer = getReducer(state)
    if (reducer) {
      return getComputedValue(reducer)
    }
    return getCachValue(state)
  } finally {
    if (recording) {
      recording.add(state)
    }
  }
}

const getValueOfSetterFunction = (state: CommonInternal, value: (v: unknown) => unknown): unknown => {
  const prevValue = getCachValue(state)
  return value(prevValue)
}

const setValue = (state: CommonInternal, value: unknown): void => {
  const nonFuncValue = isFunction(value) ? getValueOfSetterFunction(state, value) : value

  applyUpdates(state, nonFuncValue)
}

const notifySubscribers = (state: CommonInternal) => {
  const stack: CommonInternal[] = [state]

  while (stack.length) {
    const st = stack.pop()
    st.childs.forEach((it) => stack.push(it))
    st.hasParentUpdates = true
    states2notify.add(state)
  }
}

const applyUpdates = (state: CommonInternal, value: unknown): void => {
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

export const startRecord = () => {
  recording = new Set()
}

export const flushStates = () => {
  const data = recording
  recording = undefined
  return data
}

export const subscribe = <T extends CommonInternal | ComputedInternal>(
  state: T,
  listner: Listner,
): UnSubscribe => {
  /**
   * Если значение стейта ниразу не расчитывалось, его нужно обновить
   * Если подписываемся на вычисляемый стэйт, то нужно узнать всех родителей
   * Родители могут меняться, поэтому после каждого вычисления нужно обновлять зависимости дерева
   *
   * При отписке нужно оповестить всех на кого были опдписанты о том что мы отписались
   *
   */

  if (state.subscribes.has(listner)) {
    return () => ({})
  }

  const reducer = isComputed(state as any)
  if (reducer) {
    getComputedValue(state as any)
  }

  state.subscribes.add(listner)

  return () => {
    state.subscribes.delete(listner)
    if (state.subscribes.size === 0) {
      state.depends.forEach((parent) => parent.childs.delete(state as any))
    }
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

  const data: CommonInternal = {
    childs: new Set(),
    depends: new Set(),
    history: Array.from({ length: settings.historyLength }),
    historyCursor: 0,
    name: getName(options?.name),
    subscribes: new Set(),
    hasParentUpdates: undefined,
  }

  setValue(data, value)

  const f = function () {
    return getValue(data)
  }

  Object.defineProperty(f, 'name', { value: data.name })
  f.subscribe = (listner: Listner) => subscribe(data, listner)
  f.set = (value: T) => setValue(data, value)
  f._internal = data

  return f as State<T>
}

export const computed = <
  T extends StateType = -1,
  S extends StatlessFunc = StatlessFunc,
  O extends Nullable<ComputedInternalOptions> = Nullable<ComputedInternalOptions>,
>(
  value: GetStatlessFunc<T, S, O>,
  options?: O,
): Computed<T> => {
  const data: ComputedInternal = {
    childs: new Set(),
    depends: new Set(),
    hasParentUpdates: true,
    history: Array.from({ length: settings.historyLength }),
    historyCursor: 0,
    initial: options?.initial as ReturnType<typeof value> | undefined,
    isComputing: false,
    name: getName(options?.name),
    reducer: value,
    subscribes: new Set(),
  }

  const f = function () {
    return getValue(data)
  }

  Object.defineProperty(f, 'name', { value: data.name })
  f.subscribe = (listner: Listner) => subscribe(data, listner)
  f._internal = data

  return f as Computed<T>
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
