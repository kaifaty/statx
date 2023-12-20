import {pushHistory, setRequester, getRequester, updateDeps} from './proto-base'
import type {IComputed, Listner} from './type'
import {assert} from '../utils'
import type {UnSubscribe} from '../types/types'

export function SubscribeComputed(this: IComputed, listner: Listner): UnSubscribe {
  this.get()
  return this.subscribeState(listner)
}

export function GetComputedValue(this: IComputed): unknown {
  try {
    const requesterComputed = getRequester()
    if (requesterComputed) {
      this._listeners.add(requesterComputed)
    }
    updateDeps(this)
    setRequester(this)

    if (isDontNeedRecalc(this)) {
      return this.currentValue
    }

    assert(this.isComputing, `Loops dosen't allows. Name: ${this.name ?? 'Unnamed state'}`)

    this.isComputing = true

    pushHistory(this, this.reducer(this.currentValue ?? this.initial))
    this.isComputing = false
    this._hasParentUpdates = false

    return this.currentValue
  } catch (e) {
    console.error(`Error in computed name: ${this.name}. Message: ${(e as Error).message}`)
    this.isComputing = false
    this._hasParentUpdates = false
    return undefined
  } finally {
    setRequester(undefined)
  }
}

function isDontNeedRecalc(value: IComputed): boolean {
  // TODO ввести уникальное значение для еще не подсчитанного состояния
  return value._hasParentUpdates === false && value.currentValue !== undefined
}
