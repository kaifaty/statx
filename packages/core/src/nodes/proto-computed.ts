/* eslint-disable @typescript-eslint/no-unused-vars */
import {requester} from '../helpers/requester'
import {status} from '../helpers/status'
import type {CommonInternal, IComputed, Listener} from '../helpers/type'
import {assert} from '../utils'
import type {UnSubscribe} from '../types/types'
import {nodesMap} from '../helpers/nodes-map'
import {recorder} from '../helpers/recorder'
import {nodeHistory} from '../helpers/history'
import {logs} from '../helpers/logs'

export function SubscribeComputed(this: IComputed, listener: Listener): UnSubscribe {
  const sub = this.subscribeState(listener)
  this.get()
  return sub
}

/**
 * Есть 2 сценария запроса вычисления:
 * Снизу-вверх
 * Сверху-вниз
 *
 * При инвалидации какой-то ноды после ее вычисления - нужно проверить изменилось ли значения.
 * И только если изменилось - начинать вычислять нижние.
 *
 * При вычислении новой ноды,
 */
export function GetComputedValue(this: IComputed): unknown {
  const requesterNode = requester.peek()

  try {
    requester.push(this)

    if (isDontNeedRecalc(this)) {
      return this.currentValue
    }

    nodeHistory.pushReason(requesterNode, this)

    const isComputingNode = status.getValue(this, 'computing')
    assert(Boolean(isComputingNode), `Loops dosen't allows. Name: ${this.name}`)

    status.setValue(this, 'computing', 1)
    nodesMap.removeLinks(this)

    const value = this.compute(this.currentValue ?? this.initial)

    nodeHistory.push(this, value, 'calc')
    nodesMap.recalcChilds(this, this.currentValue !== this.prevValue)

    return this.currentValue
  } catch (e) {
    console.error(`Error in computed name: ${this.name}. Message: ${(e as Error).message}`, {sd: this}, e)

    throw e
  } finally {
    status.setValue(this, 'computing', 0)
    status.setValue(this, 'hasParentUpdate', 0)

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
