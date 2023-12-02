/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Action,
  ActionOptions,
  CommonInternal,
  Listner,
  Options,
  PublicState,
  State,
  StateType,
  UnSubscribe,
} from './types/index.js'
import {getName} from './utils.js'
import {assert, isFunction} from './utils.js'
import {
  Computed,
  ComputedInternal,
  ComputedInternalOptions,
  GetStatlessFunc,
  Nullable,
  SetterFunc,
  StatlessFunc,
} from './types/index.js'

export class Common implements CommonInternal {
  static states2notify: Record<number, Common> = {}
  static isNotifying = false
  static requesters: Common[] = []
  static recording: Set<Common> | undefined
  static historyLength = 5
  static nounce = 0
  id: number

  childs: Record<number, Common> = Object.create(null)
  parents: Record<number, Common> = Object.create(null)
  subscribes: Set<Listner> = new Set()

  history = Array.from({length: Common.historyLength})
  historyCursor = -1

  name: string

  hasParentUpdates: boolean | undefined

  constructor(options?: Options) {
    this.name = getName(options?.name)
    this.id = Common.nounce++
  }

  get peek() {
    return this.history[this.historyCursor]
  }

  protected _updateDeps() {
    const lastRequester = Common.requesters.at(-1)
    if (lastRequester && !this.childs[lastRequester.id]) {
      this.childs[lastRequester.id] = lastRequester
      lastRequester.parents[this.id] = this
    }
  }

  protected _pushHistory(value: unknown) {
    const cursorHistory = this.historyCursor
    this.historyCursor = (cursorHistory + 1) % this.history.length
    this.history[this.historyCursor] = value
  }

  protected _invalidateSubtree() {
    const stack: Common[] = [this]

    while (stack.length) {
      const st = stack.pop()
      if (!st) {
        continue
      }

      Object.values<Common>(st.childs).forEach((it) => stack.push(it))
      st.hasParentUpdates = true
      if (st.subscribes.size) {
        Common.states2notify[st.id] = st
      }
    }
  }

  /**
   * Notify all collected subscribers once in microtask queue
   */
  protected _notifySubscribers() {
    if (Common.isNotifying === false) {
      Common.isNotifying = true
      queueMicrotask(() => {
        // Нужно обновить дерево
        Object.values<Common>(Common.states2notify).forEach((state) => {
          try {
            state.subscribes.forEach((listner) => {
              return listner(state.getValue())
            })
          } catch (e) {
            console.error('Error in subscriber function of:', state.name)
          } finally {
            delete Common.states2notify[state.id]
          }
        })
        Common.isNotifying = false
      })
    }
  }

  subscribe(listner: Listner): UnSubscribe {
    /**
     * Если значение стейта ниразу не расчитывалось, его нужно обновить
     * Если подписываемся на вычисляемый стэйт, то нужно узнать всех родителей
     * Родители могут меняться, поэтому после каждого вычисления нужно обновлять зависимости дерева
     *
     * При отписке нужно оповестить всех на кого были опдписанты о том что мы отписались
     *
     */

    if (this.subscribes.has(listner)) {
      return () => ({})
    }

    this.subscribes.add(listner)

    return () => {
      this.subscribes.delete(listner)
      if (this.subscribes.size === 0) {
        Object.values<Common>(this.parents).forEach((parent) => delete parent.childs[this.id])
      }
    }
  }

  getValue() {
    this._updateDeps()
    Common.recording?.add(this)
    return this.peek
  }
}

class StateX extends Common {
  constructor(value: unknown, options?: Options) {
    super(options)
    this.setValue(value)
  }
  setValue(value: unknown): void {
    const newValue = isFunction(value) ? value(this.peek) : value

    if (newValue === this.peek) {
      return
    }
    this._pushHistory(newValue)
    this._invalidateSubtree()
    this._notifySubscribers()
  }
}

class ComputedX extends Common implements ComputedInternal {
  initial?: unknown
  isComputing: boolean = false
  reducer: SetterFunc

  constructor(value: SetterFunc, options?: ComputedInternal) {
    super(options)
    this.reducer = value as SetterFunc
    this.initial = options?.initial
  }

  subscribe(listner: Listner): UnSubscribe {
    // Нужно актуализировать в родилеях зависимость
    this.computeValue()

    Object.values<Common>(this.parents).forEach((parent) => (parent.childs[this.id] = this))
    return super.subscribe(listner)
  }
  getValue() {
    try {
      this._updateDeps()
      return this.computeValue()
    } finally {
      Common.recording?.add(this)
    }
  }

  private isDontNeedRecalc(): boolean {
    return this.hasParentUpdates === false && this.peek !== undefined
  }

  private computeValue(): unknown {
    try {
      if (this.isDontNeedRecalc()) {
        const rec = Common.recording
        if (rec) {
          Object.values<Common>(this.parents).forEach((item) => rec?.add(item))
        }
        return this.peek
      }

      assert(this.isComputing, `Loops dosen't allows. Name: ${this.name ?? 'Unnamed state'}`)

      Common.requesters.push(this)
      Object.values<Common>(this.parents).forEach((item) => {
        delete item.childs[this.id]
        delete this.parents[item.id]
      })

      this.isComputing = true
      const value = this.reducer(this.peek ?? this.initial)
      this.isComputing = false
      this.hasParentUpdates = false

      Common.requesters.pop()
      this._pushHistory(value)

      return value
    } catch (e) {
      console.error(`Error in computed name: ${this.name}. Message: ${(e as Error).message}`)
      this.isComputing = false
      return undefined
    }
  }
}

const createPublic = (internal: ComputedX | StateX) => {
  const publicApi = function () {
    return internal.getValue() //getValue(internal)
  }
  Object.defineProperty(publicApi, 'name', {
    value: internal.name,
    writable: false,
  })
  Object.defineProperty(publicApi, '_internal', {
    value: internal,
    writable: false,
  })
  Object.defineProperty(publicApi, 'subscribe', {
    value: (listner: Listner) => internal.subscribe(listner),
    writable: false,
  })
  Object.defineProperty(publicApi, 'peek', {
    get() {
      return internal.peek
    },
    configurable: false,
  })

  if (!('reducer' in internal)) {
    Object.defineProperty(publicApi, 'set', {
      value: (value: unknown) => internal.setValue(value),
      writable: false,
    })
  }

  return publicApi
}

export function state<T extends StateType = StateType>(value: T, options?: Options): State<T> {
  assert(isFunction(value), 'Function not allowed in state')
  const statex = new StateX(value, options)

  return createPublic(statex) as State<T>
}

export const computed = <
  T extends StateType = -1,
  S extends StatlessFunc<T> = StatlessFunc<T>,
  O extends Nullable<ComputedInternalOptions<T, S>> = Nullable<ComputedInternalOptions<T, S>>,
>(
  value: GetStatlessFunc<T, S>,
  options?: O,
): Computed<T> => {
  assert(!isFunction(value), 'In computed must be functions only')

  return createPublic(new ComputedX(value as SetterFunc, options as ComputedInternal)) as Computed<T>
}

/**
 * Start collecting all non computed states.
 *
 * Helper for render adapters.
 */
export const startRecord = () => {
  Common.recording = new Set()
}

/**
 * Flush all collected non computed states.
 */
export const flushStates = (): Set<Common> | undefined => {
  const data = Common.recording
  Common.recording = undefined
  return data
}

export const action = <T extends unknown[]>(
  value: (...args: T) => void,
  options?: ActionOptions,
): Action<T> => {
  return {
    run: (...args: T) => {
      //isActionNow = true
      value(...args)
      //isActionNow = false
      return this
    },
    name: getName(options?.name),
  }
}

export const isStateType = (v: unknown): v is PublicState<any> => {
  return typeof v === 'function' && '_internal' in v && v._internal instanceof Common
}
