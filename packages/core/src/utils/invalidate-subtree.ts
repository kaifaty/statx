import type {CommonInternal} from '../types/index.js'
import {states2notify} from './notify-subscribers.js'

/**
 * Mark all subtree is non actual.
 * Collect all nodes to notify subscribers im microtask queue.
 */
export const invalidateSubtree = (state: CommonInternal) => {
  const stack: CommonInternal[] = [state]

  while (stack.length) {
    const st = stack.pop()
    if (!st) {
      continue
    }
    st.childs.forEach((it) => stack.push(it))
    st.hasParentUpdates = true
    if (st.subscribes.size) {
      states2notify.add(st)
    }
  }
}
