import {UnSubscribe} from '../types'
import {Base, Listner, CommonInternal, IComputed} from './type'

let nounce = 0
let isNotifying = false
let recording: Set<Base> | undefined = undefined
let requester: IComputed | undefined
const states2notify: Set<Listner> = new Set()

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

export const setRequester = (value: IComputed | undefined) => (requester = value)
export const getRequester = () => requester
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

  return () => this._listeners.delete(listner)
}

function isComputed(item: Listner | IComputed): item is IComputed {
  return '_computed' in item
}

export function notifySubscribers() {
  if (isNotifying === false) {
    isNotifying = true

    Promise.resolve().then(() => {
      states2notify.forEach((item) => {
        item(item.base.get())
      })
      states2notify.clear()
      isNotifying = false
    })
  }
}

export function invalidateSubtree(value: Base) {
  value._listeners.forEach((item) => {
    if (isComputed(item)) {
      item._hasParentUpdates = true
      invalidateSubtree(item)
    } else {
      states2notify.add(item)
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
