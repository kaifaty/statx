/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CommonInternal} from './type'
import {logs} from './logs'

export class NodesMap {
  private debuggerRegistry: Map<string, WeakRef<CommonInternal>> = new Map()
  private finalizationRegistry = new FinalizationRegistry((stateName: string) => {
    const cachedState = this.debuggerRegistry.get(stateName)
    if (cachedState && !cachedState.deref()) {
      this.debuggerRegistry.delete(stateName)
    }
  })
  private nodesResolvers: Record<string, Array<(v: any) => void>> = {}

  nodes2notify: Set<CommonInternal> = new Set()
  isNotifying = false

  addLink(sourceNode: CommonInternal, targetNode: CommonInternal, info?: string) {
    if (!sourceNode.deps) {
      sourceNode.deps = []
    }
    if (!targetNode.deps) {
      targetNode.deps = []
    }
    // if (!sourceNode.children) {
    //   sourceNode.children = new Set()
    // }
    // if (!targetNode.parents) {
    //   targetNode.parents = new Set()
    // }
    if (sourceNode.id === targetNode.id) {
      throw new Error(`Trying to set loop children ${info}`)
    }
    sourceNode.deps.push(targetNode, 1)
    targetNode.deps.push(sourceNode, 2)

    // sourceNode.children.add(targetNode)
    // targetNode.parents.add(sourceNode)
  }

  removeLinks(sourceNode: CommonInternal) {
    if (!sourceNode.deps) {
      return
    }
    for (let i = 0; i < sourceNode.deps.length; i += 2) {
      if (sourceNode.deps[i + 1] === 2) {
        const parent = sourceNode.deps[i] as CommonInternal

        for (let j = 0; j < parent.deps.length; j += 2) {
          if (parent.deps[j + 1] === 1) {
            const child = parent.deps[j]
            if (parent === child) {
              parent.deps.splice(j, 2)
              j -= 2
            }
          }
        }
        sourceNode.deps.splice(i, 2)
        i -= 2
      }
    }
    // sourceNode.parents?.forEach((parent) => {
    //   parent.children.delete(sourceNode)
    // })
    // sourceNode.parents?.clear()
  }

  recalcChilds(sourceNode: CommonInternal, changed: boolean) {
    if (changed && sourceNode.deps) {
      for (let i = 0; i < sourceNode.deps.length; i += 2) {
        if (sourceNode.deps[i + 1] === 1) {
          const item = sourceNode.deps[i] as CommonInternal
          this.nodes2notify.add(item)
          item.hasParentUpdate = 1

          sourceNode.deps.splice(i, 2)
          i -= 2
        }
      }
      // sourceNode.children?.forEach((item) => {
      //   this.nodes2notify.add(item)
      //   item.hasParentUpdate = 1
      // })
      // sourceNode.children?.clear()
    }
  }

  notifySubscribers() {
    if (this.isNotifying === false) {
      this.isNotifying = true

      Promise.resolve().then(() => {
        while (this.nodes2notify.size) {
          const node = this.nodes2notify.values().next().value
          const listenersLen = node.listeners?.length ?? 0
          const value = node.get()
          for (let i = 0; i < listenersLen; i++) {
            node.listeners[i](value)
            logs.dispatchValueUpdate(node)
          }
          this.nodes2notify.delete(node)
        }
        this.isNotifying = false
      })
    }
  }

  addNodeToDebug(state: CommonInternal) {
    if (!logs.enabled) {
      return
    }
    if (this.debuggerRegistry.get(state.name)?.deref()) {
      console.warn(state.name, 'alredy exist')
      return
    }
    this.debuggerRegistry.set(state.name, new WeakRef(state))
    this.finalizationRegistry.register(state, state.name)
    this.nodesResolvers[state.name]?.forEach((resolve) => {
      resolve({res: state})
    })
    delete this.nodesResolvers[state.name]
  }

  getNodeByName<T extends CommonInternal>(name: string, timeout?: number): Promise<{res: T}> {
    return new Promise<{res: T}>((resolve, reject) => {
      const existValue = this.debuggerRegistry.get(name)?.deref()

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
}

export const nodesMap = new NodesMap()
