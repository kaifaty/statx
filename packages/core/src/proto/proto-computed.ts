import {pushHistory, setRequester, getRequester, updateDeps, getLogsEnabled} from './proto-base'
import type {IComputed, Listner} from './type'
import {assert, isComputed} from '../utils'
import type {UnSubscribe} from '../types/types'

export function SubscribeComputed(this: IComputed, listner: Listner): UnSubscribe {
  this.get()
  return this.subscribeState(listner)
}

export function GetComputedValue(this: IComputed): unknown {
  const requesterComputed = getRequester()

  try {
    setRequester(this)

    if (isDontNeedRecalc(this)) {
      return this.currentValue
    }
    if (requesterComputed && getLogsEnabled()) {
      if (!requesterComputed._reason) {
        requesterComputed._reason = []
      }
      requesterComputed._reason.push(this)
    }
    this._listeners.forEach((item) => {
      if (isComputed(item)) {
        this._listeners.delete(item)
      }
    })

    assert(this._isComputing, `Loops dosen't allows. Name: ${this.name}`)

    this._isComputing = true
    const value = this.reducer(this.currentValue ?? this.initial)
    pushHistory(this, value, 'calc')
    this._isComputing = false
    this._hasParentUpdates = false

    return this.currentValue
  } catch (e) {
    console.error(`Error in computed name: ${this.name}. Message: ${(e as Error).message}`, {sd: this})
    this._isComputing = false
    this._hasParentUpdates = false
    return undefined
  } finally {
    if (requesterComputed) {
      this._listeners.add(requesterComputed)
    }
    updateDeps(this)
    setRequester(undefined)
  }
}

function isDontNeedRecalc(value: IComputed): boolean {
  // TODO ввести уникальное значение для еще не подсчитанного состояния
  return value._hasParentUpdates === false && value.currentValue !== undefined
}
