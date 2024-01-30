/* eslint-disable @typescript-eslint/no-unused-vars */
import {requester} from './requester'
import {status} from './status'
import type {CommonInternal, IComputed, Listner} from './type'
import {assert} from '../utils'
import type {UnSubscribe} from '../types/types'
import {nodesMap} from './nodes-map'
import {recorder} from './recorder'
import {nodeHistory} from './history'
import {logs} from './logs'

export function SubscribeComputed(this: IComputed, listner: Listner): UnSubscribe {
  const sub = this.subscribeState(listner)
  this.get()
  return sub
}

export function GetComputedValue(this: IComputed): unknown {
  const requesterNode = requester.peek()
  //console.time(this.name)
  try {
    requester.push(this)

    if (isDontNeedRecalc(this)) {
      return this.currentValue
    }
    status.setValue(this, 'parentsLen', 0)

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
    //console.timeEnd(this.name)
  }
}

function isDontNeedRecalc(node: CommonInternal): boolean {
  // TODO ввести уникальное значение для еще не подсчитанного состояния ??
  return status.getValue(node, 'hasParentUpdate') === 0 && node.currentValue !== undefined
}
