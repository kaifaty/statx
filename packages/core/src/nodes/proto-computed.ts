/* eslint-disable @typescript-eslint/no-unused-vars */
import {requester} from '../helpers/requester'
import {status} from '../helpers/status'
import type {CommonInternal, IComputed, Listener} from '../helpers/type'
import {assert} from '../helpers/utils'
import type {UnSubscribe} from '../types/types'
import {nodesMap} from '../helpers/nodes-map'
import {recorder} from '../helpers/recorder'
import {nodeHistory} from '../helpers/history'

export function SubscribeComputed(this: IComputed, listener: Listener): UnSubscribe {
  const sub = this.subscribeState(listener)
  this.get()
  return sub
}

/**
 * Get or calculate new value
 */
export function GetComputedValue(this: IComputed): unknown {
  const requesterNode = requester.peek()

  try {
    requester.push(this)

    if (isDontNeedRecalc(this)) {
      return this.currentValue
    }

    nodeHistory.pushReason(requesterNode, this)

    assert(Boolean(this.computing), `Loops dosen't allows. Name: ${this.name}`)

    this.computing = 1
    nodesMap.removeLinks(this)

    const value = this.compute(this.currentValue ?? this.initial)

    nodeHistory.push(this, value, 'calc')
    nodesMap.reCalcChildren(this, this.currentValue !== this.prevValue)

    return this.currentValue
  } catch (e) {
    console.error(`Error in computed name: ${this.name}. Message: ${(e as Error).message}`, {sd: this}, e)

    throw e
  } finally {
    this.hasParentUpdate = 0
    this.computing = 0

    if (requesterNode) {
      nodesMap.addLink(this, requesterNode, 'computation')
    }

    recorder.add(this)
    requester.pop()
  }
}

function isDontNeedRecalc(node: CommonInternal): boolean {
  // TODO ввести уникальное значение для еще не подсчитанного состояния ??
  return node.hasParentUpdate === 0 && node.currentValue !== undefined
}
