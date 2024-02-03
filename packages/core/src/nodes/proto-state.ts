import type {IState} from '../helpers/type'
import {isFunction} from '../utils'
import {logs} from '../helpers/logs'
import {nodesMap} from '../helpers/nodes-map'
import {recorder} from '../helpers/recorder'
import {nodeHistory} from '../helpers/history'
import {requester} from '../helpers/requester'

export function SetValue(this: IState, value: unknown) {
  const newValue = isFunction(value) ? value(this.currentValue) : value
  if (newValue === this.currentValue) {
    return
  }

  nodeHistory.push(this, newValue, 'outside')
  nodesMap.nodes2notify.add(this)
  nodesMap.recalcChilds(this, true)
  nodesMap.notifySubscribers()
  logs.dispatchValueUpdate(this)
}

export function GetStateValue(this: IState) {
  recorder.add(this)
  const requesterNode = requester.peek()
  if (requesterNode) {
    nodesMap.addLink(this, requesterNode, 'read state')
  }
  return this.currentValue
}
