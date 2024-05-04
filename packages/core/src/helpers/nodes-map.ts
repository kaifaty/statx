/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CommonInternal, ILinkedList, INode, ListenerInternal} from './type'
import {dependencyTypes} from './status'
import {LinkedList, isAsyncComputed} from './utils'
import {reason} from '.'

export class NodesMap {
  nodes2notify: Set<CommonInternal> = new Set()
  isNotifying = false

  addLink(sourceNode: CommonInternal, targetNode: CommonInternal, info?: string) {
    if (sourceNode.id === targetNode.id) {
      throw new Error(`Trying to set loop children ${info}`)
    }
    if (!sourceNode.deps) {
      sourceNode.deps = new LinkedList(targetNode, dependencyTypes.child)
    } else {
      sourceNode.deps.push(targetNode, dependencyTypes.child)
    }
    if (!targetNode.deps) {
      targetNode.deps = new LinkedList(sourceNode, dependencyTypes.parent)
    } else {
      targetNode.deps.push(sourceNode, dependencyTypes.parent)
    }
  }

  removeLinks(sourceNode: CommonInternal) {
    if (sourceNode.deps) {
      let current: INode | undefined = sourceNode.deps.head
      while (current) {
        if (current.type === dependencyTypes.parent) {
          const value = current.value as CommonInternal
          let currentChild: INode | undefined = value.deps?.head

          while (currentChild) {
            if (currentChild.type === dependencyTypes.child && currentChild.value === sourceNode) {
              value.deps.remove(currentChild)
            }
            currentChild = currentChild.next
          }
          sourceNode.deps.remove(current)
        }
        current = current.next
      }
    }
  }

  reCalcChildren(sourceNode: CommonInternal, changed: boolean) {
    if (!changed || !sourceNode.deps) {
      return
    }

    let current = sourceNode.deps.head
    while (current) {
      if (current.type === dependencyTypes.child) {
        const value = current.value as CommonInternal
        reason.setReason(value, sourceNode)

        if (isAsyncComputed(value)) {
          value.onDepsChange(sourceNode.name)
        } else {
          this.nodes2notify.add(value)
          value.hasParentUpdate = 1
          sourceNode.deps.remove(current)
        }
      }
      current = current.next
    }
  }

  notifySubscribers() {
    if (this.isNotifying === false) {
      this.isNotifying = true

      Promise.resolve().then(() => {
        while (this.nodes2notify.size) {
          const node: CommonInternal = this.nodes2notify.values().next().value
          const value = node.get()
          let current = node.deps?.head
          while (current) {
            if (current.type === dependencyTypes.listener) {
              ;(current.value as ListenerInternal)(value)
            }
            current = current.next
          }

          this.nodes2notify.delete(node)
        }
        this.isNotifying = false
      })
    }
  }
}

export const nodesMap = new NodesMap()
