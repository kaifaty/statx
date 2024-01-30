import {status} from './status'
import type {CommonInternal, HistoryChange} from './type'
import {logs} from './logs'

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
    const cursor = status.getValue(node, 'historyCursor')
    status.setValue(node, 'historyCursor', (cursor + 1) % this.MAX)
  }
  changeMax(value: number) {
    this.MAX = value
  }

  push(node: CommonInternal, value: unknown, reason: HistoryChange['reason']) {
    node.prevValue = node.currentValue
    node.currentValue = value

    if (logs.enabled) {
      this.init(node)
      this.moveHistoryCursor(node)

      node._history[status.getValue(node, 'historyCursor')] = {
        reason: reason,
        changer: node._reason,
        value,
        ts: Date.now(),
      }
    }
  }
}

export const nodeHistory = new NodeHistory()
