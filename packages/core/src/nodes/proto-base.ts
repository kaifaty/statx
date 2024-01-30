/* eslint-disable @typescript-eslint/no-explicit-any */

import {UnSubscribe} from '../types'
import {CommonInternal, Listner} from '../helpers/type'

/**
 * If the state value has never been calculated, it needs to be updated.
 * If we subscribe to a computed state, we need to know all the parents.
 * Parents can change, so after each calculation, we need to update the dependencies of the tree.
 * When unsubscribing, we need to notify all the subscribers that we have unsubscribed.
 */
export function Subscribe(this: CommonInternal, listener: Listner): UnSubscribe {
  if (!listener.base) {
    listener.base = this
  } else if (Array.isArray(listener.base)) {
    listener.base.push(this)
  } else {
    listener.base = [listener.base, this]
  }
  if (!this.listeners) {
    this.listeners = []
  }
  this.listeners.push(listener)

  return () => {
    this.listeners.filter((item) => item !== listener)
  }
}

export function Peek(this: CommonInternal) {
  return this.currentValue
}
