/* eslint-disable @typescript-eslint/no-unused-vars */
import {requester} from '../helpers/requester'
import {status} from '../helpers/status'
import type {CommonInternal, IComputed, Listner} from '../helpers/type'
import {assert} from '../utils'
import type {UnSubscribe} from '../types/types'
import {nodesMap} from '../helpers/nodes-map'
import {recorder} from '../helpers/recorder'
import {nodeHistory} from '../helpers/history'
import {logs} from '../helpers/logs'

export function SubscribeComputed(this: IComputed, listner: Listner): UnSubscribe {
  const sub = this.subscribeState(listner)
  this.get()
  return sub
}

export function GetComputedValue(this: IComputed): unknown {
  const requesterNode = requester.peek()

  try {
    requester.push(this)

    if (isDontNeedRecalc(this)) {
      return this.currentValue
    }

    if (requesterNode && logs.enabled) {
      if (!requesterNode._reason) {
        requesterNode._reason = []
      }
      requesterNode._reason.push(this)
    }

    const isComputingNode = status.getValue(this, 'computing')
    assert(Boolean(isComputingNode), `Loops dosen't allows. Name: ${this.name}`)

    status.setValue(this, 'computing', 1)
    const value = this.compute(this.currentValue ?? this.initial)
    nodeHistory.push(this, value, 'calc')
    status.setValue(this, 'computing', 0)
    status.setValue(this, 'hasParentUpdate', 0)

    return this.currentValue
  } catch (e) {
    console.error(`Error in computed name: ${this.name}. Message: ${(e as Error).message}`, {sd: this})

    status.setValue(this, 'computing', 0)
    status.setValue(this, 'hasParentUpdate', 0)
    return undefined
  } finally {
    if (requesterNode) {
      nodesMap.addLink(this, requesterNode, 'computation')
    }
    recorder.add(this)
    requester.pop()
  }
}

function isDontNeedRecalc(node: CommonInternal): boolean {
  // TODO ввести уникальное значение для еще не подсчитанного состояния ??
  return status.getValue(node, 'hasParentUpdate') === 0 && node.currentValue !== undefined
}
