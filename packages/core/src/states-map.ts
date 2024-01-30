/* eslint-disable @typescript-eslint/no-explicit-any */
import {logs} from './proto'
import type {CommonInternal} from './proto/type'

const statesMap: Map<string, WeakRef<CommonInternal>> = new Map()

export const getStatesMap = () => statesMap

const statesMapResolvers: Record<string, Array<(v: any) => void>> = {}

const registry = new FinalizationRegistry((stateName: string) => {
  const cachedState = statesMap.get(stateName)

  if (cachedState && !cachedState.deref()) {
    statesMap.delete(stateName)
  }
})

export const addState = (state: CommonInternal) => {
  if (!logs.enabled) {
    return
  }
  if (statesMap.get(state.name)?.deref()) {
    console.warn(state.name, 'alredy exist')
    return
  }
  statesMap.set(state.name, new WeakRef(state))
  registry.register(state, state.name)
  statesMapResolvers[state.name]?.forEach((resolve) => {
    resolve({res: state})
  })
  delete statesMapResolvers[state.name]
}

export const getStateByName = <T extends CommonInternal>(
  name: string,
  timeout?: number,
): Promise<{res: T}> => {
  return new Promise<{res: T}>((resolve, reject) => {
    const existValue = statesMap.get(name)?.deref()
    if (existValue) {
      resolve({res: existValue as T})
      return
    }
    if (!statesMapResolvers[name]) {
      statesMapResolvers[name] = []
    }
    statesMapResolvers[name].push(resolve)
    if (timeout) {
      setTimeout(() => {
        reject(timeout)
      }, timeout)
    }
  })
}
