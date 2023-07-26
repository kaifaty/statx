import {subscribe} from './utils/subscribe.js'
import {
  Computed,
  ComputedInternal,
  ComputedInternalOptions,
  GetStatlessFunc,
  Listner,
  Nullable,
  StateType,
  StatlessFunc,
} from './types/index.js'
import {getName} from './utils/get-name.js'
import {getValue} from './utils/get-value.js'
import {settings} from './utils/settings.js'

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
