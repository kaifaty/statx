import type {CommonInternal, Listner, Options, State, StateType} from './types/index.js'
import {getName} from './utils/get-name.js'
import {getValue} from './utils/get-value.js'
import {setValue} from './utils/set-value.js'
import {settings} from './utils/settings.js'
import {assert, isFunction} from './utils/utils.js'
import {subscribe} from './utils/subscribe.js'

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
