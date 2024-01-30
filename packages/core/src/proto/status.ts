/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CommonInternal, NodeType} from './type'

type StatusKey = keyof typeof size
type Item = {
  start: number
  end: number
  length: number
  defaultValue: number
}
type BitsMap = Record<StatusKey, Item>

export const stateTypes = {
  state: 0,
  list: 1,
  async: 2,
  computed: 3,
} satisfies Record<NodeType, number>

const size = {
  type: {length: 3, defaultValue: 1},
  hasParentUpdate: {length: 1, defaultValue: 0},
  parentsLen: {length: 5, defaultValue: 0},
  childrenLen: {length: 5, defaultValue: 0},
  listeners: {length: 9, defaultValue: 0},
  historyCursor: {length: 5, defaultValue: 0},
  computing: {length: 1, defaultValue: 0},
  async: {length: 1, defaultValue: 1},
} as const

const getBitsMap = () => {
  let shift = 0

  return Object.entries(size).reduce<BitsMap>((acc, [key, {length, defaultValue}]) => {
    const item: Item = {
      start: shift,
      length,
      defaultValue,
      end: shift + length - 1,
    }
    shift += length
    //@ts-ignore
    acc[key] = item
    return acc
  }, {} as BitsMap)
}

class Status {
  bitsMap = getBitsMap()

  initStatus(node: CommonInternal, type: NodeType) {
    node.type = stateTypes[type]
    node.hasParentUpdate = 0
    node.parentsLen = 0
    node.childrenLen = 0
    node.listeners = 0
    node.historyCursor = 0
    node.computing = 0
    node.async = 0
  }

  getValue(node: CommonInternal, type: StatusKey) {
    return node[type]
  }
  setValue(node: CommonInternal, type: StatusKey, value: number) {
    node[type] = value
  }

  getNodeType(node: CommonInternal): NodeType {
    const nodeType = this.getValue(node, 'type')
    const namedType = Object.entries(stateTypes).find((item) => item[1] === nodeType)?.[0] as any
    if (!namedType) {
      console.error(node)
      throw new Error('Unknown type:' + nodeType + ' name: ' + node.name)
    }
    return namedType
  }
}

export const status = new Status()
