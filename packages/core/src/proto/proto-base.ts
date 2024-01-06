import {UnSubscribe} from '../types'
import {Base, Listner, CommonInternal, IComputed} from './type'

let nounce = 0
let isNotifying = false
let recording: Set<Base> | undefined = undefined
const requester: Array<IComputed> = []
const states2notify: Array<Listner> = []

export const startRecord = () => {
  recording = new Set()
}

/**
 * Flush all collected non computed states.
 */
export const flushStates = (): Set<Base> | undefined => {
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
export const getNounce = () => nounce++
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

export function isComputed(item: Listner | IComputed): item is IComputed {
  return '_computed' in item
}

export function notifySubscribers() {
  if (isNotifying === false) {
    isNotifying = true

    Promise.resolve().then(() => {
      const len = states2notify.length
      for (let i = 0; i < len; i++) {
        const item = states2notify[i]
        item(item.base.get())
        item.willNotify = false
      }

      states2notify.length = 0
      isNotifying = false
    })
  }
}

export function invalidateSubtree(value: Base) {
  value._listeners.forEach((item) => {
    if (isComputed(item)) {
      item._hasParentUpdates = true
      invalidateSubtree(item)
    } else if (item?.willNotify === false) {
      states2notify.push(item)
      item.willNotify = true
    }
  })
}

export function pushHistory(target: CommonInternal, value: unknown) {
  target.prevValue = target.currentValue
  target.currentValue = value
}

export function Peek(this: CommonInternal) {
  return this.currentValue
}

export function updateDeps(target: CommonInternal) {
  recording?.add(target as Base)
}
