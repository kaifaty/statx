import type {StateVariants} from '../types/types.js'
import {getValue} from './get-value.js'

let isNotifying = false

export const states2notify = new Set<StateVariants>()
/**
 * Notify all collected subscribers once in microtask queue
 */
export const notifySubscribers = () => {
  if (isNotifying === false) {
    isNotifying = true
    queueMicrotask(() => {
      // Нужно обновить дерево
      states2notify.forEach((state) => {
        try {
          state.subscribes.forEach((listner) => {
            return listner(getValue(state))
          })
        } catch (e) {
          console.error('Error in subscriber function of:', state.name)
        }
      })
      states2notify.clear()
      isNotifying = false
    })
  }
}
