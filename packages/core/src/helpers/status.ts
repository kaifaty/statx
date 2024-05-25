/* eslint-disable @typescript-eslint/no-explicit-any */
import {events} from '.'
import type {CommonInternal, DependencyType, NodeType, SettableStatus, StatusKey} from './type'

export const stateTypes = {
  state: 0,
  list: 1,
  async: 2,
  computed: 3,
} satisfies Record<NodeType, number>

export const dependencyTypes = {
  listener: 0,
  child: 1,
  parent: 2,
} satisfies Record<DependencyType, number>

class Status {
  initStatus(id: number, node: CommonInternal, type: NodeType) {
    node.id = id
    node.type = stateTypes[type]

    if (type === 'computed') {
      node.computing = 0
    }
    if (type === 'async') {
      node.async = 0
    }
    events.dispatchEvent('NodeCreate', node)
  }
}

export const status = new Status()
