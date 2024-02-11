import {events} from '.'
import type {CommonInternal} from './type'

class Reason {
  setReason(node: CommonInternal, reason: NonNullable<CommonInternal['reason']>) {
    if (events.enabled) {
      node.reason = reason
    }
  }
}
export const reason = new Reason()
