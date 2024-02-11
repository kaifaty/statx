/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CommonInternal} from '@statx/core'
import {events, isStatxFn} from '@statx/core'

export class NodesMap {
  private nodesRegistry: Map<string, WeakRef<CommonInternal>> = new Map()
  private finalizationRegistry = new FinalizationRegistry((stateName: string) => {
    const cachedState = this.nodesRegistry.get(stateName)
    if (cachedState && !cachedState.deref()) {
      this.nodesRegistry.delete(stateName)
    }
  })
  private nodesResolvers: Record<string, Array<(v: any) => void>> = {}
  constructor() {
    events.on('NodeCreate', (node) => {
      if (isStatxFn(node)) {
        this.addNodeToRegistry(node)
      }
    })
  }

  addNodeToRegistry(state: CommonInternal) {
    if (!events.enabled) {
      return
    }
    if (this.nodesRegistry.get(state.name)?.deref()) {
      console.warn(state.name, 'already exist')
      return
    }
    this.nodesRegistry.set(state.name, new WeakRef(state))
    this.finalizationRegistry.register(state, state.name)
    this.nodesResolvers[state.name]?.forEach((resolve) => {
      resolve({res: state})
    })
    delete this.nodesResolvers[state.name]
  }

  getNodeByName<T extends CommonInternal>(name: string, timeout?: number): Promise<{res: T}> {
    return new Promise<{res: T}>((resolve, reject) => {
      const existValue = this.nodesRegistry.get(name)?.deref()

      if (existValue) {
        resolve({res: existValue as T})
        return
      }

      if (!this.nodesResolvers[name]) {
        this.nodesResolvers[name] = []
      }

      this.nodesResolvers[name].push(resolve)

      if (timeout) {
        setTimeout(() => {
          reject(timeout)
        }, timeout)
      }
    })
  }

  getNodes() {
    return [...this.nodesRegistry.values()]
  }
}
