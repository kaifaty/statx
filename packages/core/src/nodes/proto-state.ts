import {
  reason,
  type IState,
  nodesMap,
  recorder,
  isFunction,
  nodeHistory,
  requester,
  stateTypes,
  type CommonInternal,
} from '../helpers'

export function notify(state: IState, value: unknown) {
  nodeHistory.push(state, value)
  nodesMap.nodes2notify.add(state)
  nodesMap.reCalcChildren(state, true)
  nodesMap.notifySubscribers()
}

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
  notify(this, newValue)
}

export function GetStateValue(this: IState) {
  recorder.add(this)
  const requesterNode = requester.peek()

  if (requesterNode) {
    nodesMap.addLink(this, requesterNode, 'read state')
  }
  return this.currentValue
}
