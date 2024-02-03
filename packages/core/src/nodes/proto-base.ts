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
  if (!this.deps) {
    this.deps = []
  }
  const wrapper = (v: unknown) => listener(v)
  this.deps.push(wrapper, 0)

  return () => {
    const indexListener = this.deps?.indexOf(wrapper) ?? -1
    if (indexListener >= 0) {
      this.deps.splice(indexListener, 2)
      if (this.deps!.length === 0) {
        //@ts-ignore
        this.deps = undefined
      }
    }
  }
}

export function Peek(this: CommonInternal) {
  return this.currentValue
}
