/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CommonInternal, MapType, Listner, IState, IComputed} from './type'
import type {NodesMap} from './nodes-map'
import {status} from './status'
import {nonce} from './nonce'

type ValidationNode = {
  valid: boolean
  empty: Array<number>
  count: number
}
export class NodeMapValidators {
  constructor(private nodeMap: NodesMap) {}
  getMap(type: MapType) {
    const map = {
      parents: {key: 'parentsLen', src: this.nodeMap.parents},
      children: {key: 'childrenLen', src: this.nodeMap.children},
      listeners: {key: 'listeners', src: this.nodeMap.listeners},
    } as const
    return map[type]
  }
  private find(node: CommonInternal, value: Listner | CommonInternal, type: MapType) {
    const parentsItem = this.getMap(type)
    const count = status.getValue(node, parentsItem.key)
    const src = parentsItem.src

    for (let i = 0; i < count; i++) {
      const id = this.nodeMap.createId(node, i)
      if (src[id] === value) {
        return src[id]
      }
    }
  }
  findListener(node: unknown, listener: unknown) {
    return this.find(node as CommonInternal, listener as Listner, 'listeners')
  }
  findParent(node: unknown, target: unknown) {
    return this.find(node as CommonInternal, target as CommonInternal, 'parents')
  }
  findChild(node: unknown, target: unknown) {
    return this.find(node as CommonInternal, target as CommonInternal, 'children')
  }

  validate(node: CommonInternal, type: MapType): ValidationNode {
    const typeItem = this.getMap(type)
    const count = status.getValue(node, typeItem.key)
    const empty = []
    let existParents = 0
    for (let i = 0; i < count; i++) {
      if (typeItem.src[this.nodeMap.createId(node, i)]) {
        existParents++
      } else {
        empty.push(i)
      }
    }
    return {
      valid: count === existParents,
      empty: empty,
      count: existParents,
    }
  }
  clearMap() {
    this.nodeMap.listeners = {}
    this.nodeMap.parents = {}
    this.nodeMap.children = {}
    nonce.clear()
    // TODO пройтись по всем нодам и обнолить внутренний стейт
  }
}
