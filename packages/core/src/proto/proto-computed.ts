import {pushHistory, setRequester, getRequester, updateDeps, isComputed} from './proto-base'
import type {IComputed, Listner} from './type'
import {assert} from '../utils'
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
    this._listeners.forEach((item) => {
      if (isComputed(item)) {
        this._listeners.delete(item)
      }
    })

    assert(this.isComputing, `Loops dosen't allows. Name: ${this._name ?? 'Unnamed state'}`)

    this.isComputing = true

    pushHistory(this, this.reducer(this.currentValue ?? this.initial))
    this.isComputing = false
    this._hasParentUpdates = false

    return this.currentValue
  } catch (e) {
    console.error(`Error in computed name: ${this._name}. Message: ${(e as Error).message}`)
    this.isComputing = false
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
