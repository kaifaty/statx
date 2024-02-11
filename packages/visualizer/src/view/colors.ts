import {stateTypes} from '@statx/core'

import {darken, from, lighten, luminance, mix} from 'better-color-tools'
import type {ForceGraphInstance} from 'force-graph'

type LCH = {
  l: number
  c: number
  h: number
}

export class Colors {
  private _base: LCH = {l: 0.17, c: 0.1, h: 230}
  private _particle: LCH = {l: 0.6, c: 0.25, h: 10}
  private _graph?: ForceGraphInstance
  nodeColors = {
    [stateTypes.state]: 'Magenta',
    [stateTypes.async]: 'deepskyblue',
    [stateTypes.list]: 'OrangeRed',
    [stateTypes.computed]: 'chartreuse',
  }
  setGraph(graph: ForceGraphInstance) {
    this._graph = graph
  }

  get base() {
    return from(this._base)
  }
  get link(): string {
    return mix(this.base.rgb, [1, 1, 300]).rgb
  }
  get particle() {
    return from(this._particle).rgb
  }
  get background(): string {
    return this.base.rgb
  }
  get dialogBackground(): string {
    return lighten(this.background, 0.11).rgb
  }
  get dialogColor(): string {
    return lighten(this.background, 0.98).rgb
  }
  getNodeColorBackground(nodeType: number): string {
    return this.nodeColors[nodeType]
  }
  getNodeColor(nodeType: number): string {
    return darken(this.nodeColors[nodeType], 0.6).oklch
  }
}
