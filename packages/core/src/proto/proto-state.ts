import type {IState} from './type'
import {isFunction} from '../utils'
import {logs} from './logs'
import {nodesMap} from './nodes-map'
import {recorder} from './recorder'
import {nodeHistory} from './history'
import {requester} from './requester'

export function SetValue(this: IState, value: unknown) {
  const newValue = isFunction(value) ? value(this.currentValue) : value
  if (newValue === this.currentValue) {
    return
  }

  nodeHistory.push(this, newValue, 'outside')
  nodesMap.invalidate(this)
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
