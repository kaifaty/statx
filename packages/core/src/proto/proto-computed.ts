import {getRecording, pushHistory, setRequesters, updateDeps} from './proto-base'
import {CommonInternal, IComputed} from './type'
import {assert, onEach} from '../utils'
import type {Listner, UnSubscribe} from '../types/types'

export function SubscribeComputed(this: IComputed, listner: Listner): UnSubscribe {
  computeValue(this)
  return this.subscribeState(listner)
}

export function GetComputedValue(this: IComputed) {
  try {
    updateDeps(this)
    return computeValue(this)
  } finally {
    getRecording()?.add(this)
  }
}

function computeValue(target: IComputed): unknown {
  if (isDontNeedRecalc(target)) {
    const rec = getRecording()
    if (rec) {
      onEach<CommonInternal>(target._parents, (item) => rec?.add(item))
    }
    return target.currentValue
  }

  try {
    assert(target.isComputing, `Loops dosen't allows. Name: ${target.name ?? 'Unnamed state'}`)
    setRequesters(target)

    onEach<CommonInternal>(target._parents, (item) => {
      delete item._childs[target._id]
      delete target._parents[item._id]
    })

    target.isComputing = true

    const value = target.reducer(target.currentValue ?? target.initial)

    setRequesters(undefined)
    pushHistory(target, value)

    return value
  } catch (e) {
    console.error(`Error in computed name: ${target.name}. Message: ${(e as Error).message}`)

    return undefined
  } finally {
    target.isComputing = false
    target._hasParentUpdates = false
  }
}

function isDontNeedRecalc(value: IComputed): boolean {
  return value._hasParentUpdates === false && value.currentValue !== undefined
}
