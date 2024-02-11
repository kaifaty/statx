import type {CommonInternal} from '@statx/core'

export type NodeObject = {
  id: number
  x: number
  y: number
  color: string
  base: CommonInternal
  __bgDimensions: [number, number]
}

export type Link = {
  index: number
  source: NodeObject
  target: NodeObject
}
