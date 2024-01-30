import type {Listner, CommonInternal} from './type'
import {status} from './status'
import {logs} from './logs'
import {assert, isAsyncComputed} from '../utils'
import {MapType} from './type'

export class NodesMap {
  listeners: Record<string, Listner> = Object.create(null)
  parents: Record<string, CommonInternal> = Object.create(null)
  children: Record<string, CommonInternal> = Object.create(null)

  private isNotifying = false
  private states2notify: Set<CommonInternal> = new Set()

  createId(node: CommonInternal, count: number) {
    if (logs.enabled) {
      return `${node.name}; i:${count}`
    }
    return `${node._id}#${count}`
  }
  getCount(type: MapType) {
    return Object.keys(this[type]).length
  }
  addListener(node: CommonInternal, listener: Listner) {
    const count = status.getValue(node, 'listeners')
    this.listeners[this.createId(node, count)] = listener
    status.setValue(node, 'listeners', count + 1)
  }
  removeListener(node: CommonInternal, listener: Listner) {
    const count = status.getValue(node, 'listeners')
    let removed = false

    for (let i = 0; i < count; i++) {
      const id = this.createId(node, i)
      if (this.listeners[id] === listener) {
        delete this.listeners[id]
        removed = true
        continue
        // после этого все ключи с ID нужно уменьшить на 1
      }
      if (removed) {
        const newID = this.createId(node, i - 1)
        const value = this.listeners[id]
        delete this.listeners[id]
        this.listeners[newID] = value
      }
    }
    const newCount = count - 1
    status.setValue(node, 'listeners', newCount)

    if (newCount === 0) {
      const childenLen = status.getValue(node, 'childrenLen')
      /**
       * If has children - it means some node has listener. Skip
       */
      if (childenLen === 0) {
        this.removeListenerDeps(node)
      }
    }
  }
  removeListenerDeps(node: CommonInternal) {
    const listeners = status.getValue(node, 'listeners')
    if (listeners) {
      return
    }

    const parentsLen = status.getValue(node, 'parentsLen')
    const childenLen = status.getValue(node, 'childrenLen')

    if (childenLen) {
      for (let i = 0; i < childenLen; i++) {
        const id = this.createId(node, i)
        delete this.children[id]
      }
      status.setValue(node, 'childrenLen', 0)
    }
    if (parentsLen) {
      for (let i = 0; i < parentsLen; i++) {
        const id = this.createId(node, i)
        const parentNode = this.parents[id]
        delete this.parents[id]
        this.removeListenerDeps(parentNode)
      }
      status.setValue(node, 'parentsLen', 0)
    }
  }

  addLink(sourceNode: CommonInternal, targetNode: CommonInternal, info?: string) {
    // Задвоение связей. При инвалидации не очищаются предыдущие связи

    const listenersLength = status.getValue(targetNode, 'listeners')
    if (listenersLength === 0) {
      // return
    }

    addChildToSource: {
      const count = status.getValue(sourceNode, 'childrenLen')
      const id = this.createId(sourceNode, count)
      this.children[id] = targetNode
      status.setValue(sourceNode, 'childrenLen', count + 1)
    }
    addParentToTarget: {
      //const count = status.getValue(targetNode, 'parentsLen')
      //const id = this.createId(targetNode, count)
      //this.parents[id] = sourceNode
      //status.setValue(targetNode, 'parentsLen', count + 1)
    }
  }
  /**
   * Removes all links
   * Exact parent of each children
   * Exach children of each parent
   *
   * Should normalize all parents and childen keys
   *
   * При удалении листнера наличие чайлдов означает что внузи есть свои листнеры.
   * Значит не нужно удалять связи сверху
   *
   *
   */

  /**
   * Инвалидировать нужно вниз по дереву.
   * итерируемся по children, проставляем hasParentUpdate = 1
   */
  invalidate(node: CommonInternal, level = 0) {
    const childenLen = status.getValue(node, 'childrenLen')
    const listenersLen = status.getValue(node, 'listeners')

    if (listenersLen) {
      this.states2notify.add(node)
    }

    //if (parentsLen) {
    //  for (let i = 0; i < parentsLen; i++) {
    //    const parentId = this.createId(node, i)
    //    delete this.parents[parentId]
    //  }
    //  status.setValue(node, 'parentsLen', 0)
    //}

    if (childenLen) {
      for (let i = 0; i < childenLen; i++) {
        const id = this.createId(node, i)
        const childNode = this.children[id]
        delete this.children[id]

        if (!childNode) {
          throw new Error('CANT ACCESS TO CHILD NODE, SOMETHING WRONG')
        }
        status.setValue(childNode, 'hasParentUpdate', 1)
        logs.logReason(node, childNode, level)

        if (isAsyncComputed(childNode)) {
          childNode.onDepsChange()
        } else {
          this.invalidate(childNode, level + 1)
        }
      }
      status.setValue(node, 'childrenLen', 0)
    }
  }
  notifySubscribers() {
    if (this.isNotifying === false) {
      this.isNotifying = true

      Promise.resolve().then(() => {
        this.states2notify.forEach((node) => {
          const listenersLen = status.getValue(node, 'listeners')
          for (let i = 0; i < listenersLen; i++) {
            const id = this.createId(node, i)
            const listener = this.listeners[id]
            assert(!listener, 'CANT ACCESS TO LISTENER, SOMETHING WRONG')
            listener(node.get())
            logs.dispatchValueUpdate(node)
          }
        })

        this.states2notify.clear()
        this.isNotifying = false
        logs.dispatchUpdate()
      })
    }
  }
}

export const nodesMap = new NodesMap()
