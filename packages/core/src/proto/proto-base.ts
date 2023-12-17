import {onEach} from '../utils'
import {Listner, UnSubscribe} from '../types'
import {Base, CommonInternal, IComputed, IState} from './type'

let nounce = 0
let isNotifying = false
let recording: Set<CommonInternal> | undefined = undefined
let states2notify: Record<number, CommonInternal> = Object.create(null)

const requesters: CommonInternal[] = []

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

export const getRequesters = () => requesters
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

export function NotifySubscribers(this: CommonInternal) {
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

export function InvalidateSubtree(this: CommonInternal) {
  this._hasParentUpdates = true
  states2notify[this._id] = this
  onEach<CommonInternal>(this._childs, (item) => {
    ;(item as Base).invalidateSubtree()
    // item.cause = this.name
  })
}

export function PushHistory(this: CommonInternal, value: unknown) {
  this.prevValue = this.currentValue
  this.currentValue = value
}

export function Peek(this: CommonInternal) {
  return this.currentValue
}

export function IsDontNeedRecalc(this: IComputed): boolean {
  return this._hasParentUpdates === false && this.currentValue !== undefined
}

export function UpdateDeps(this: CommonInternal) {
  const requesters = getRequesters()
  const lastRequester = requesters[requesters.length - 1]

  if (lastRequester && !this._childs[lastRequester._id]) {
    this._childs[lastRequester._id] = lastRequester
    lastRequester._parents[this._id] = this
  }
}
