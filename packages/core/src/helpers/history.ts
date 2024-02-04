import {status} from './status'
import type {CommonInternal, HistoryChange} from './type'
import {events} from './events'

class NodeHistory {
  private MAX = 10
  private init(node: CommonInternal) {
    if (node._history === undefined) {
      node.historyCursor = 0
      node._history = []
    }
    if (this.MAX !== node._history.length) {
      node._history.length = this.MAX
    }
  }
  private moveHistoryCursor(node: CommonInternal) {
    const cursor = node.historyCursor
    node.historyCursor = (cursor + 1) % this.MAX
  }

  changeMax(value: number) {
    this.MAX = value
  }

  push(node: CommonInternal, value: unknown, reason: HistoryChange['reason']) {
    node.prevValue = node.currentValue
    node.currentValue = value

    if (events.enabled) {
      this.init(node)
      this.moveHistoryCursor(node)

      node._history[node.historyCursor] = {
        reason: reason,
        changer: node._reason,
        value,
        ts: Date.now(),
      }
    }
  }
  pushReason(sourceNode: CommonInternal | undefined, reasonNode: CommonInternal) {
    if (!events.enabled || !sourceNode) {
      return
    }
    if (!sourceNode._reason) {
      sourceNode._reason = []
    }
    sourceNode._reason.push(reasonNode)
  }
}

export const nodeHistory = new NodeHistory()
