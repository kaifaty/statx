import {getRecording, getRequesters} from './proto-base'
import {CommonInternal, IComputed} from './type'
import {assert, onEach} from '../utils'
import type {Listner, UnSubscribe} from '../types/types'

export function SubscribeComputed(this: IComputed, listner: Listner): UnSubscribe {
  this.computeValue()
  onEach<CommonInternal>(this._parents, (parent) => (parent._childs[this._id] = this))
  return this.subscribeState(listner)
}

export function GetComputedValue(this: IComputed) {
  try {
    this.updateDeps()
    return this.computeValue()
  } finally {
    getRecording()?.add(this)
  }
}

export function ComputeValue(this: IComputed) {
  try {
    if (this.isDontNeedRecalc()) {
      const rec = getRecording()
      if (rec) {
        onEach<CommonInternal>(this._parents, (item) => rec?.add(item))
      }
      return this.currentValue
    }

    assert(this.isComputing, `Loops dosen't allows. Name: ${this.name ?? 'Unnamed state'}`)
    const requesters = getRequesters()

    requesters.push(this)

    onEach<CommonInternal>(this._parents, (item) => {
      delete item._childs[this._id]
      delete this._parents[item._id]
    })

    this.isComputing = true

    const value = this.reducer(this.currentValue ?? this.initial)

    this.isComputing = false
    this._hasParentUpdates = false

    requesters.pop()
    this.pushHistory(value)

    return value
  } catch (e) {
    console.error(`Error in computed name: ${this.name}. Message: ${(e as Error).message}`)
    this.isComputing = false
    return undefined
  }
}
