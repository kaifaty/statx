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
  _id: number

  _childs: Record<number, Common> = Object.create(null)
  _parents: Record<number, Common> = Object.create(null)
  _subscribes: Set<Listner> = new Set()

  _history = Array.from({length: Common.historyLength})
  _historyCursor = -1
  _hasParentUpdates: boolean | undefined

  name: string

  cause?: string

  constructor(options?: Options) {
    this.name = getName(options?.name)
    this._id = Common.nounce++
  }

  get peek() {
    return this._history[this._historyCursor]
  }

  protected _updateDeps() {
    const lastRequester = Common.requesters.at(-1)
    if (lastRequester && !this._childs[lastRequester._id]) {
      this._childs[lastRequester._id] = lastRequester
      lastRequester._parents[this._id] = this
    }
  }

  protected _pushHistory(value: unknown) {
    const cursorHistory = this._historyCursor
    this._historyCursor = (cursorHistory + 1) % this._history.length
    this._history[this._historyCursor] = value
  }

  protected _invalidateSubtree() {
    const stack: Common[] = [this]

    while (stack.length) {
      const st = stack.pop()
      if (!st) {
        continue
      }

      Object.values<Common>(st._childs).forEach((it) => {
        it.cause = st.name
        stack.push(it)
      })
      st._hasParentUpdates = true
      if (st._subscribes.size) {
        Common.states2notify[st._id] = st
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
            state._subscribes.forEach((listner) => {
              return listner(state.getValue())
            })
          } catch (e) {
            console.error('Error in subscriber function of:', state.name)
          } finally {
            delete Common.states2notify[state._id]
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

    if (this._subscribes.has(listner)) {
      return () => ({})
    }

    this._subscribes.add(listner)

    return () => {
      this._subscribes.delete(listner)
      if (this._subscribes.size === 0) {
        Object.values<Common>(this._parents).forEach((parent) => delete parent._childs[this._id])
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

  Object.setPrototypeOf(publicApi, internal)
  Object.defineProperty(publicApi, 'name', {
    value: internal.name,
    writable: false,
  })

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
