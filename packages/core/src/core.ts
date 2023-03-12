import {
  ComputedInternal,
  Listner,
  StateType,
  Settings,
  StateVariants,
  Action,
  Options,
  ComputedInternalOptions,
  Nullable,
  StatlessFunc,
  GetStatlessFunc,
  HistoryInternal,
  State,
  Computed,
  Func,
  UnSubscribe,
  CommonInternal,
  StateInternal,
  SetterFunc,
} from './types.js'

let cache = new WeakMap<StateVariants, StateType>()
let isNotifying = false
let isActionNow = false
let recording: Set<StateInternal> | undefined

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

const getComputed = (state: CommonInternal | ComputedInternal) => {
  if ('reducer' in state) {
    return state
  }
}

const isFunction = (v: unknown): v is Func => {
  return typeof v === 'function'
}

const updateHistory = <T extends HistoryInternal>(state: T, value: unknown) => {
  const cursorHistory = state.historyCursor
  state.history[cursorHistory] = value
  state.historyCursor = (cursorHistory + 1) % state.history.length
}

const isDontNeedRecalc = (state: CommonInternal, prevState: unknown): boolean => {
  return state.hasParentUpdates === false && prevState !== undefined
}

const getComputedValue = (state: ComputedInternal): unknown => {
  try {
    const prevState = getCachValue(state)

    if (isDontNeedRecalc(state, prevState)) {
      state.depends.forEach((item) => {
        recording.add(item)
      })
      return prevState
    }

    assert(state.isComputing, `Loops dosen't allows. Name: ${state.name ?? 'Unnamed state'}`)

    requesters.push(state)

    state.isComputing = true
    const value = state.reducer(prevState ?? state.initial)
    state.isComputing = false
    state.hasParentUpdates = false

    requesters.pop()
    applyUpdates(state, value)

    return value
  } catch (e) {
    console.error((e as Error).message)
    return undefined
  }
}

const getValue = (state: CommonInternal) => {
  const reducer = getComputed(state)
  try {
    const lastRequester = requesters.at(-1)
    if (lastRequester && !state.childs.has(lastRequester)) {
      state.childs.add(lastRequester)
      lastRequester.depends.add(state)
    }
    if (reducer) {
      return getComputedValue(reducer)
    }
    return getCachValue(state)
  } finally {
    if (recording && !reducer) {
      recording.add(state)
    }
  }
}

const getValueOfSetterFunction = (state: CommonInternal, value: SetterFunc): unknown => {
  const prevValue = getCachValue(state)
  return value(prevValue)
}

const setValue = (state: CommonInternal, value: unknown): void => {
  const newValue = isFunction(value) ? getValueOfSetterFunction(state, value) : value

  if (newValue === getCachValue(state)) {
    return
  }
  applyUpdates(state, newValue)
  invalidateSubtree(state)
  notifySubscribers()
}

/**
 * Mark all subtree is non actual.
 * Collect all nodes to notify subscribers im microtask queue.
 */
const invalidateSubtree = (state: CommonInternal) => {
  const stack: CommonInternal[] = [state]

  while (stack.length) {
    const st = stack.pop()
    st.childs.forEach((it) => stack.push(it))
    st.hasParentUpdates = true
    if (st.subscribes.size) {
      states2notify.add(st)
    }
  }
}

/**
 * Notify all collected subscribers once in microtask queue
 */
const notifySubscribers = () => {
  if (isNotifying === false) {
    isNotifying = true
    queueMicrotask(() => {
      // Нужно обновить дерево
      states2notify.forEach((state) => {
        try {
          state.subscribes.forEach((listner) => {
            return listner(getValue(state))
          })
        } catch (e) {
          console.error('Error in subscriber function of:', state.name)
        }
      })
      states2notify.clear()
      isNotifying = false
    })
  }
}

const applyUpdates = (state: CommonInternal, value: unknown): void => {
  setCacheValue(state, value)
  updateHistory(state, value)
}

/**
 * Start collecting all non computed states.
 *
 * Helper for render adapters.
 */
export const startRecord = () => {
  recording = new Set()
}

/**
 * Flush all collected non computed states.
 */
export const flushStates = (): Set<StateInternal> => {
  const data = recording
  recording = undefined
  return data
}

export const subscribe = (state: CommonInternal | CommonInternal, listner: Listner): UnSubscribe => {
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

  const computedState = getComputed(state)
  if (computedState) {
    getComputedValue(computedState)
  }

  state.subscribes.add(listner)

  return () => {
    state.subscribes.delete(listner)
    if (state.subscribes.size === 0) {
      state.depends.forEach((parent) => parent.childs.delete(state))
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
    history: Array.from({length: settings.historyLength}),
    historyCursor: 0,
    name: getName(options?.name),
    subscribes: new Set(),
    hasParentUpdates: undefined,
  }

  setValue(data, value)

  const publicApi = function () {
    return getValue(data)
  }

  Object.defineProperty(publicApi, 'name', {value: data.name})
  publicApi.subscribe = (listner: Listner) => subscribe(data, listner)
  publicApi.set = (value: T) => setValue(data, value)
  publicApi._internal = data

  return publicApi as State<T>
}

export const computed = <
  T extends StateType = -1,
  S extends StatlessFunc<T> = StatlessFunc<T>,
  O extends Nullable<ComputedInternalOptions> = Nullable<ComputedInternalOptions>,
>(
  value: GetStatlessFunc<T, S, O>,
  options?: O,
): Computed<T> => {
  const data: ComputedInternal = {
    childs: new Set(),
    depends: new Set(),
    hasParentUpdates: true,
    history: Array.from({length: settings.historyLength}),
    historyCursor: 0,
    initial: options?.initial as ReturnType<typeof value> | undefined,
    isComputing: false,
    name: getName(options?.name),
    reducer: value,
    subscribes: new Set(),
  }

  const publicApi = function () {
    return getValue(data)
  }

  Object.defineProperty(publicApi, 'name', {value: data.name})
  publicApi.subscribe = (listner: Listner<T>) => subscribe(data, listner as Listner)
  publicApi._internal = data

  return publicApi as Computed<T>
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
