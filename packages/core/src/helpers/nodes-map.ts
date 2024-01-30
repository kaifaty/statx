/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Listner, CommonInternal} from './type'
import {status} from './status'
import {logs} from './logs'
import {isAsyncComputed} from '../utils'

export class NodesMap {
  private debuggerRegistry: Map<string, WeakRef<CommonInternal>> = new Map()
  private finalizationRegistry = new FinalizationRegistry((stateName: string) => {
    const cachedState = this.debuggerRegistry.get(stateName)
    if (cachedState && !cachedState.deref()) {
      this.debuggerRegistry.delete(stateName)
    }
  })
  private nodesResolvers: Record<string, Array<(v: any) => void>> = {}

  private isNotifying = false
  private states2notify: Set<CommonInternal> = new Set()

  addLink(sourceNode: CommonInternal, targetNode: CommonInternal, _?: string) {
    if (!sourceNode.children) {
      sourceNode.children = []
    }
    sourceNode.children.push(targetNode)
  }

  invalidate(node: CommonInternal, level = 0) {
    if (node.listeners?.length) {
      this.states2notify.add(node)
    }
    const len = node.children?.length
    if (len) {
      for (let i = 0; i < len; i++) {
        const childNode = node.children[i]

        status.setValue(childNode, 'hasParentUpdate', 1)
        logs.logReason(node, childNode, level)

        if (isAsyncComputed(childNode)) {
          childNode.onDepsChange()
        } else {
          this.invalidate(childNode, level + 1)
        }
      }
      node.children.length = 0
    }
  }

  notifySubscribers() {
    if (this.isNotifying === false) {
      this.isNotifying = true

      Promise.resolve().then(() => {
        this.states2notify.forEach((node) => {
          const listenersLen = node.listeners.length
          const value = node.get()
          for (let i = 0; i < listenersLen; i++) {
            node.listeners[i](value)
            logs.dispatchValueUpdate(node)
          }
        })

        this.states2notify.clear()
        this.isNotifying = false
        logs.dispatchUpdate()
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
