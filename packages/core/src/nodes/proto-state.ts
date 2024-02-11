import {
  reason,
  type IState,
  events,
  nodesMap,
  recorder,
  isFunction,
  nodeHistory,
  requester,
  stateTypes,
  type CommonInternal,
} from '../helpers'

export function SetValue(this: IState, value: unknown, setReason?: CommonInternal['reason']) {
  const newValue = isFunction(value) ? value(this.currentValue) : value
  if (newValue === this.currentValue) {
    return
  }
  if (this.type === stateTypes.state) {
    reason.setReason(this, setReason ?? 'setValue')
  }
  if (this.type === stateTypes.async) {
    reason.setReason(this, setReason ?? 'asyncCalc')
  }
  nodeHistory.push(this, newValue)
  nodesMap.nodes2notify.add(this)
  nodesMap.reCalcChildren(this, true)
  nodesMap.notifySubscribers()
}

export function GetStateValue(this: IState) {
  recorder.add(this)
  const requesterNode = requester.peek()

  if (requesterNode) {
    nodesMap.addLink(this, requesterNode, 'read state')
  }
  return this.currentValue
}
