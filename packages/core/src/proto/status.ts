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

  initStatus(type: NodeType): number {
    let stateValue = 0
    Object.values(this.bitsMap).forEach((item, i) => {
      if (i === 0) {
        stateValue |= stateTypes[type] << item.start
      } else {
        stateValue |= item.defaultValue << item.start
      }
    })
    return stateValue
  }

  getValue(node: CommonInternal, type: StatusKey) {
    const info = this.bitsMap[type]
    return this.readBits(node.state, info.start, info.end)
  }
  setValue(node: CommonInternal, type: StatusKey, value: number) {
    const info = this.bitsMap[type]
    node.state = this.replaceBits(node.state, info.start, info.end, value)
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

  private readBits(num: number, startBit: number, endBit: number) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit
    return (num & mask) >> startBit
  }

  private replaceBits(num: number, startBit: number, endBit: number, replacement: number) {
    const mask = ((1 << (endBit - startBit + 1)) - 1) << startBit
    const clearedNum = num & ~mask
    const replacedBits = (replacement << startBit) & mask
    return clearedNum | replacedBits
  }
}

export const status = new Status()
