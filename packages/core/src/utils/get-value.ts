import {CommonInternal} from '../types/types.js'
import {getRecording, getRequesters} from './recording.js'
import {getComputedState, getHistoryValue} from './utils.js'
import {getComputedValue} from './get-computed-value.js'

export const getValue = (state: CommonInternal) => {
  const reducer = getComputedState(state)
  const requesters = getRequesters()
  const recording = getRecording()
  try {
    const lastRequester = requesters.at(-1)
    if (lastRequester && !state.childs.has(lastRequester)) {
      state.childs.add(lastRequester)
      lastRequester.depends.add(state)
    }
    if (reducer) {
      return getComputedValue(reducer)
    }
    return getHistoryValue(state)
  } finally {
    if (recording && !reducer) {
      recording.add(state)
    }
  }
}
