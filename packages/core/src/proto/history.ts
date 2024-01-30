import {status} from './status'
import type {CommonInternal, HistoryChange} from './type'
import {logs} from './logs'

const TOTAL_MAX_VALUE = 2 ** status.bitsMap.historyCursor.length - 1

class NodeHistory {
  private MAX = 10
  private init(node: CommonInternal) {
    if (node._history === undefined) {
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
    this.MAX = Math.max(value, TOTAL_MAX_VALUE)
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
        value: value,
        ts: Date.now(),
      }
    }
  }
}

export const nodeHistory = new NodeHistory()
