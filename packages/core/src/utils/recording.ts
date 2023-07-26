import type {ComputedInternal, StateInternal} from '../types/types.js'

let recording: Set<StateInternal> | undefined

const requesters: ComputedInternal[] = []

export const getRecording = () => recording
export const getRequesters = () => requesters

/**
 * Start collecting all non computed states.
 *
 * Helper for render adapters.
 */
export const startRecord = () => {
  recording = new Set()
}

/**
 * Flush all collected non computed states.
 */
export const flushStates = (): Set<StateInternal> | undefined => {
  const data = recording
  recording = undefined
  return data
}
