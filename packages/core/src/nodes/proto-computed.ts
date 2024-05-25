/* eslint-disable @typescript-eslint/no-unused-vars */
import {requester, assert, nodesMap, nodeHistory, recorder} from '../helpers'
import type {CommonInternal, IComputed, INode, ListenerInternal} from '../helpers'
import type {UnSubscribe} from '../types/types'

export function SubscribeComputed(
  this: IComputed,
  listener: ListenerInternal,
  subscriberName?: string,
): UnSubscribe {
  const sub = this.subscribeState(listener, subscriberName)
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

    if (!isNeedRecalc(this)) {
      return this.currentValue
    }

    assert(Boolean(this.computing), `Loops doesn't allows. Name: ${this.name}`)

    this.computing = 1
    nodesMap.removeLinks(this)

    const value = this.compute(this.currentValue ?? this.initial)
    this.needRecompute = 0

    nodeHistory.push(this, value)
    nodesMap.reCalcChildren(this, this.currentValue !== this.prevValue)

    return this.currentValue
  } catch (e) {
    console.error(`[Error in computed name]: ${this.name}. Message: ${(e as Error).message}`, {sd: this}, e)

    throw e
  } finally {
    this.computing = 0

    if (requesterNode) {
      nodesMap.addLink(this, requesterNode, 'computation')
    }

    recorder.add(this)
    requester.pop()
  }
}

function isNeedRecalc(computationgNode: CommonInternal): boolean {
  const parentNode: INode<CommonInternal> | undefined = computationgNode.parents?.head
  return Boolean(computationgNode.needRecompute) || !parentNode
}
