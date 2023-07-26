import {getRecording, getRequesters} from './recording.js'
import type {ComputedInternal, CommonInternal} from '../types/types.js'
import {assert, getHistoryValue, pushHistory} from './utils.js'

const isDontNeedRecalc = (state: CommonInternal, prevState: unknown): boolean => {
  return state.hasParentUpdates === false && prevState !== undefined
}

export const getComputedValue = (state: ComputedInternal): unknown => {
  try {
    const requesters = getRequesters()
    const prevState = getHistoryValue(state)

    if (isDontNeedRecalc(state, prevState)) {
      const rec = getRecording()
      if (rec) {
        state.depends.forEach((item) => {
          rec?.add(item)
        })
      }
      return prevState
    }

    assert(state.isComputing, `Loops dosen't allows. Name: ${state.name ?? 'Unnamed state'}`)

    requesters.push(state)
    state.depends.forEach((item) => {
      item.childs.delete(state)
    })
    state.depends.clear()
    state.isComputing = true
    const value = state.reducer(prevState ?? state.initial)
    state.isComputing = false
    state.hasParentUpdates = false

    requesters.pop()
    pushHistory(state, value)

    return value
  } catch (e) {
    console.error((e as Error).message)
    return undefined
  }
}
