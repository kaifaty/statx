/* eslint-disable @typescript-eslint/no-explicit-any */
import {logs} from '.'
import type {CommonInternal, DependencyType, NodeType, SettableStatus, StatusKey} from './type'

export const stateTypes = {
  state: 0,
  list: 1,
  async: 2,
  computed: 3,
} satisfies Record<NodeType, number>

export const LISTENER = 0
export const CHILD = 1
export const PARENT = 2

export const dependencyTypes = {
  listener: 0,
  child: 1,
  parent: 2,
} satisfies Record<DependencyType, number>

const stateArray = Object.entries(stateTypes)

class Status {
  initStatus(id: number, node: CommonInternal, type: NodeType) {
    node.id = id
    node.type = stateTypes[type]
    node.hasParentUpdate = 0

    if (type === 'computed') {
      node.computing = 0
    }
    if (type === 'async') {
      node.async = 0
    }
    logs.dispatchNodeCreate(node)
  }

  getValue(node: CommonInternal, type: StatusKey) {
    return node[type]
  }

  setValue<T extends StatusKey>(node: CommonInternal, type: T, value: SettableStatus[T]) {
    node[type] = value as any
  }

  getNodeType(node: CommonInternal): NodeType {
    const nodeType = this.getValue(node, 'type')
    const namedType = stateArray.find((item) => item[1] === nodeType)?.[0] as any
    if (!namedType) {
      console.error(node)
      throw new Error('Unknown type:' + nodeType + ' name: ' + node.name)
    }
    return namedType
  }
}

export const status = new Status()
