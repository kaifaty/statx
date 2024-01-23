/* eslint-disable @typescript-eslint/no-explicit-any */
import {isAsyncComputed, isComputed} from '../utils'
import {UnSubscribe} from '../types'
import {CommonInternal, Listner, IState, IComputed, HistoryChange} from './type'
import {events} from '../events'

let isNotifying = false
let recording: Set<CommonInternal> | undefined = undefined

let logsEnabled = false
let maxHistory = 10

export const getLogsEnabled = () => logsEnabled
export const setLogsEnabled = (value: boolean) => (logsEnabled = value)
export const setMaxHistory = (value: number) => (maxHistory = value)

export const readStates: Array<IState> = []
export const requester: Array<IComputed> = []
const states2notify: Array<Listner> = []

export const startRecord = () => (recording = new Set())

/**
 * Flush all collected non computed states.
 */
export const flushStates = (): Set<CommonInternal> | undefined => {
  const data = recording
  recording = undefined
  return data
}

export const setRequester = (value: IComputed | undefined) => {
  if (value) {
    requester.push(value)
  } else {
    requester.pop()
  }
}
export const getRequester = () => requester[requester.length - 1]

export const getRecording = (): Set<CommonInternal> | undefined => recording

/**
 * If the state value has never been calculated, it needs to be updated.
 * If we subscribe to a computed state, we need to know all the parents.
 * Parents can change, so after each calculation, we need to update the dependencies of the tree.
 * When unsubscribing, we need to notify all the subscribers that we have unsubscribed.
 */
export function Subscribe(this: CommonInternal, listner: Listner): UnSubscribe {
  listner.base = this
  this._listeners.add(listner)
  listner.willNotify = false

  return () => this._listeners.delete(listner)
}

export function notifySubscribers() {
  if (isNotifying === false) {
    isNotifying = true

    Promise.resolve().then(() => {
      const len = states2notify.length
      for (let i = 0; i < len; i++) {
        const item = states2notify[i]
        const base = item.base
        item(base.get())
        item.willNotify = false

        if (logsEnabled) {
          events.dispatchValueUpdate(base)
        }
      }

      states2notify.length = 0
      isNotifying = false
      if (logsEnabled) {
        events.dispatchUpdate()
      }
    })
  }
}
const initHistory = (target: CommonInternal) => {
  if (target._historyCursor === undefined) {
    target._historyCursor = -1
  }
  if (target._history === undefined) {
    target._history = []
  }
  if (maxHistory !== target._history.length) {
    target._history.length = maxHistory
  }
}

const moveHistoryCursor = (target: CommonInternal) => {
  target._historyCursor = (target._historyCursor + 1) % maxHistory
}

export function invalidateSubtree(state: CommonInternal, level = 0) {
  state._listeners.forEach((item) => {
    const isAsync = isAsyncComputed(item)
    if (isComputed(item) || isAsync) {
      item._hasParentUpdates = true

      logReason: {
        if (logsEnabled) {
          if (level === 0) {
            item._reason = [state]
          } else if (item._reason) {
            item._reason.length = 0
          }
        }
      }

      if (isAsync) {
        item.onDepsChange()
      } else {
        invalidateSubtree(item, level + 1)
      }
    } else if (item?.willNotify === false) {
      states2notify.push(item)
      item.willNotify = true
    }
  })
}

export function pushHistory(target: CommonInternal, value: unknown, reason: HistoryChange['reason']) {
  target.prevValue = target.currentValue
  target.currentValue = value

  if (logsEnabled && reason) {
    initHistory(target)
    moveHistoryCursor(target)
    target._history[target._historyCursor] = {
      reason: reason,
      changer: target._reason,
      value: value,
      ts: Date.now(),
    }
  }
}

export function Peek(this: CommonInternal) {
  return this.currentValue
}

export function updateDeps(target: CommonInternal) {
  recording?.add(target as CommonInternal)
}
