import type {CommonInternal} from './type'
import {events} from './events'
import {isList} from './utils'

class NodeHistory {
  private MAX = 10
  private init(node: CommonInternal) {
    if (node.history === undefined) {
      node.historyCursor = 0
      node.history = []
    }
    if (this.MAX !== node.history.length) {
      node.history.length = this.MAX
    }
  }
  private moveHistoryCursor(node: CommonInternal) {
    const cursor = node.historyCursor
    node.historyCursor = (cursor + 1) % this.MAX
  }

  changeMax(value: number) {
    this.MAX = value
  }

  push(node: CommonInternal, value: unknown) {
    if (!isList(node)) {
      node.prevValue = node.currentValue
    }
    node.currentValue = value

    if (events.enabled) {
      this.init(node)
      this.moveHistoryCursor(node)

      events.dispatchEvent('ValueUpdate', node)

      node.history[node.historyCursor] = {
        reason: node.reason,

        value,
        ts: Date.now(),
      }
    }
  }
}

export const nodeHistory = new NodeHistory()
