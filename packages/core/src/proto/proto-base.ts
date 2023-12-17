import {onEach} from '../utils'
import {Listner, UnSubscribe} from '../types'
import {CommonInternal, IState} from './type'

let nounce = 0
let isNotifying = false
let recording: Set<CommonInternal> | undefined = undefined
let states2notify: Record<number, CommonInternal> = Object.create(null)
let requester: CommonInternal | undefined

export const startRecord = () => {
  recording = new Set()
}

/**
 * Flush all collected non computed states.
 */
export const flushStates = (): Set<CommonInternal> | undefined => {
  const data = recording
  recording = undefined
  return data
}

export const isStateType = (v: unknown): v is IState => {
  return typeof v === 'function'
}

export const setRequesters = (value: CommonInternal | undefined) => (requester = value)
export const getRequesters = () => requester
export const getNounce = () => nounce++
export const getRecording = (): Set<CommonInternal> | undefined => recording

/**
 * If the state value has never been calculated, it needs to be updated.
 * If we subscribe to a computed state, we need to know all the parents.
 * Parents can change, so after each calculation, we need to update the dependencies of the tree.
 * When unsubscribing, we need to notify all the subscribers that we have unsubscribed.
 */
export function Subscribe(this: CommonInternal, listner: Listner): UnSubscribe {
  this._subscribes.push(listner)

  return () => {
    const index = this._subscribes.findIndex((item) => item === listner)
    this._subscribes.splice(index, 1)

    if (this._subscribes.length === 0) {
      onEach<CommonInternal>(this._parents, (parent) => {
        delete parent._childs[this._id]
      })
    }
  }
}

export function notifySubscribers() {
  if (isNotifying === false) {
    isNotifying = true

    Promise.resolve().then(() => {
      onEach<CommonInternal>(states2notify, (state) => {
        try {
          state._subscribes.forEach((listner) => listner(state.get()))
        } catch (e) {
          console.error('Error in subscriber function of:', state.name)
        }
      })
      states2notify = Object.create(null)
      isNotifying = false
    })
  }
}

export function invalidateSubtree(value: CommonInternal) {
  value._hasParentUpdates = true
  states2notify[value._id] = value
  onEach<CommonInternal>(value._childs, invalidateSubtree)
}

export function pushHistory(target: CommonInternal, value: unknown) {
  target.prevValue = target.currentValue
  target.currentValue = value
}

export function Peek(this: CommonInternal) {
  return this.currentValue
}

export function updateDeps(target: CommonInternal) {
  if (requester && !target._childs[requester._id]) {
    target._childs[requester._id] = requester
    requester._parents[target._id] = target
  }
}
