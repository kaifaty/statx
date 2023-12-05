/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CommonInternal, Listner, Options, PublicState, UnSubscribe} from './types/index.js'
import {getName} from './utils.js'

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

export const createPublic = (internal: Common) => {
  const publicApi = function () {
    return internal.getValue()
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

  if ('setValue' in internal) {
    Object.defineProperty(publicApi, 'set', {
      value: (value: unknown) => (internal as any).setValue(value),
      writable: false,
    })
  }

  return publicApi
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

export const isStateType = (v: unknown): v is PublicState<any> => {
  return typeof v === 'function' && '_internal' in v && v._internal instanceof Common
}
