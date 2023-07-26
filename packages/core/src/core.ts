import {settings} from './utils/settings.js'
import {subscribe} from './utils/subscribe.js'
import {
  ComputedInternal,
  Listner,
  StateType,
  Action,
  Options,
  ComputedInternalOptions,
  Nullable,
  StatlessFunc,
  GetStatlessFunc,
  State,
  Computed,
  CommonInternal,
  ActionOptions,
} from './types/index.js'
import {assert, isFunction} from './utils/utils.js'
import {setValue} from './utils/set-value.js'
import {getValue} from './utils/get-value.js'

let isActionNow = false

const defaultName = 'Unnamed state'
const names = new Set()

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
    historyCursor: -1,
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
  O extends Nullable<ComputedInternalOptions<T>> = Nullable<ComputedInternalOptions<T>>,
>(
  value: GetStatlessFunc<T, S, O>,
  options?: O,
): Computed<T> => {
  const data: ComputedInternal = {
    childs: new Set(),
    depends: new Set(),
    hasParentUpdates: true,
    history: Array.from({length: settings.historyLength}),
    historyCursor: -1,
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
 * Action state
 * @param value - Action function
 * @param name
 */
export const action = <T extends unknown[]>(
  value: (...args: T) => void,
  options?: ActionOptions,
): Action<T> => {
  return {
    run: (...args: T) => {
      isActionNow = true
      value(...args)
      isActionNow = false
      return this
    },
    name: getName(options?.name),
    onAction: options?.onAction,
  }
}
