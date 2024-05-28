/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CommonInternal, ILinkedList, INode, ListenerInternal} from './type'
import {dependencyTypes} from './status'
import {LinkedList, isAsyncComputed} from './utils'
import {reason} from '.'

export class NodesMap {
  nodes2notify: Set<CommonInternal> = new Set()
  isNotifying = false

  private addParent(sourceNode: CommonInternal, targetNode: CommonInternal) {
    if (!targetNode.parents) {
      targetNode.parents = new LinkedList<CommonInternal>(sourceNode, dependencyTypes.parent)
    } else {
      targetNode.parents.push(sourceNode, dependencyTypes.parent)
    }
  }

  private addChild(sourceNode: CommonInternal, targetNode: CommonInternal) {
    if (!sourceNode.deps) {
      sourceNode.deps = new LinkedList(targetNode, dependencyTypes.child)
    } else {
      sourceNode.deps.push(targetNode, dependencyTypes.child)
    }
  }

  addLink(sourceNode: CommonInternal, targetNode: CommonInternal, info?: string) {
    if (sourceNode.id === targetNode.id) {
      throw new Error(`Trying to set loop children ${info}`)
    }
    this.addChild(sourceNode, targetNode)
    this.addParent(sourceNode, targetNode)
  }

  removeLinks(sourceNode: CommonInternal) {
    if (!sourceNode.parents?.length) {
      return
    }
    let current: INode<CommonInternal> | undefined = sourceNode.parents.head
    while (current) {
      const value = current.value as CommonInternal
      let currentChild: INode<CommonInternal | ListenerInternal> | undefined = value.deps?.head

      while (currentChild) {
        if (currentChild.type === dependencyTypes.child && currentChild.value === sourceNode) {
          value.deps.remove(currentChild)
        }
        currentChild = currentChild.next
      }
      current = current.next
    }
    sourceNode.parents.clear()
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
          value.needRecompute = 1
          this.nodes2notify.add(value)
        }
      }
      current = current.next
    }
  }

  notifySubscribers() {
    if (this.isNotifying === false) {
      this.isNotifying = true

      Promise.resolve().then(() => {
        const values = this.nodes2notify.values()
        let node = values.next().value

        while (node) {
          const value = node.get()
          let current = node.deps?.head
          while (current) {
            if (current.type === dependencyTypes.listener) {
              ;(current.value as ListenerInternal)(value)
            }

            current = current.next
          }

          node = values.next().value
        }
        this.nodes2notify.clear()
        this.isNotifying = false
      })
    }
  }
}

export const nodesMap = new NodesMap()
