import {isStatxFn} from '@statx/core'
import type {NodeUpdater} from './updaters'

export class HTMLResult {
  static cacheNodes: Map<string, DocumentFragment> = new Map()

  root: Node[]
  valuesWithSignals = 0

  constructor(
    public fragment: DocumentFragment,
    private nodes: NodeUpdater[],
    public hash: string,
    private values: unknown[],
  ) {
    this.root = [...fragment.childNodes]

    this.valuesWithSignals = values.reduce<number>((acc, v) => (isStatxFn(v) ? acc + 1 : acc), 0)
  }

  get valuesWithoutSignals() {
    return this.values.length - this.valuesWithSignals
  }

  dispose() {
    this.nodes.forEach((updater) => updater.unSubscribe())
    HTMLResult.cacheNodes.delete(this.hash)
  }

  restore() {
    this.nodes.forEach((updater) => updater.subscribe())
  }
}
