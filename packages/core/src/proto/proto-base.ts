/* eslint-disable @typescript-eslint/no-explicit-any */

import {UnSubscribe} from '../types'
import {CommonInternal, Listner} from './type'

import {nodesMap} from './nodes-map'

/**
 * If the state value has never been calculated, it needs to be updated.
 * If we subscribe to a computed state, we need to know all the parents.
 * Parents can change, so after each calculation, we need to update the dependencies of the tree.
 * When unsubscribing, we need to notify all the subscribers that we have unsubscribed.
 */
export function Subscribe(this: CommonInternal, listner: Listner): UnSubscribe {
  if (!listner.base) {
    listner.base = this
  } else if (Array.isArray(listner.base)) {
    listner.base.push(this)
  } else {
    listner.base = [listner.base, this]
  }
  nodesMap.addListener(this, listner)

  return () => {
    nodesMap.removeListener(this, listner)
  }
}

export function Peek(this: CommonInternal) {
  return this.currentValue
}
