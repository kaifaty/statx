/* eslint-disable @typescript-eslint/no-explicit-any */

import type {Listener, UnSubscribe} from '../types'
import type {CommonInternal, ListenerInternal} from '../helpers/type'
import {LinkedList} from '../helpers/utils'
import {dependencyTypes} from '../helpers/status'

/**
 * If the state value has never been calculated, it needs to be updated.
 * If we subscribe to a computed state, we need to know all the parents.
 * Parents can change, so after each calculation, we need to update the dependencies of the tree.
 * When unsubscribing, we need to notify all the subscribers that we have unsubscribed.
 */
export function Subscribe(this: CommonInternal, listener: Listener, subscriberName?: string): UnSubscribe {
  const wrapper: ListenerInternal = (v: unknown) => listener(v)
  wrapper.subscriber = subscriberName ?? 'to_' + this.name

  if (!this.deps) {
    this.deps = new LinkedList(wrapper, dependencyTypes.listener)
  } else {
    this.deps.push(wrapper, dependencyTypes.listener)
  }

  return () => {
    const node = this.deps.find(wrapper)
    if (node) {
      this.deps.remove(node)
      if (this.deps.length === 0) {
        //@ts-ignore
        delete this.deps
      }
    }
  }
}

export function Peek(this: CommonInternal) {
  return this.currentValue
}
