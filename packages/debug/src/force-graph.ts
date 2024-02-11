/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CommonInternal} from '@statx/core'
import {
  isComputed,
  eachDependency,
  isStatxFn,
  isAsyncComputed,
  getDependencyType,
  getNodeType,
} from '@statx/core'

import type {GraphData, ForceGraphInstance, LinkObject} from 'force-graph'
import ForceGraph from 'force-graph'
import type {Link, NodeObject} from './types'

const nodesMap = window.nodesMap

export type GraphParametrs = {
  nodeSize: number
  arrowSize: number
  speed: number
  particleColor: string
  linkColor: string
  bgColor: string
  nodeColors: Record<number, string>
}

export class InitGraph {
  private _data: GraphData
  graph: ForceGraphInstance
  private _params: GraphParametrs
  options = {
    showAsyncSubStates: false,
  }

  constructor(element: HTMLElement, params: GraphParametrs) {
    this.graph = ForceGraph()(element)
    this._data = this.data()
    this._params = params
    this.graph
      .graphData(this._data)
      //@ts-ignore
      .nodeAutoColorBy((node: NodeObject) => node.base._type)

      //@ts-ignore
      .nodeCanvasObject((...args) => this.nodeDraw(...args))
      //@ts-ignore
      .nodePointerAreaPaint((...args) => this.nodePointerArea(...args))
      //@ts-ignore
      .onNodeHover((node: NodeObject) => {
        const name = node?.base?.name
        if (name) {
          window.dispatchEvent(
            new CustomEvent('nodeChange', {
              detail: name,
            }),
          )
        }
      })

    window.events.on('ValueUpdate', (source) => {
      requestAnimationFrame(() => {
        this.onNodeValuesUpdate(source)
      })
    })

    this.updateProps(params)
  }
  private emitParticleIfLink(source: CommonInternal, target: CommonInternal) {
    const links = this._data.links as Link[]
    const link = links.find((item) => {
      return item.source.id === source.id && item.target.id === target.id
    })
    if (link) {
      this.graph.emitParticle(link)
    }
    return Boolean(link)
  }
  private nodeDraw(node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) {
    const label = node.base.name?.split('::')[0]
    const fontSize = 13 / globalScale
    ctx.font = `${fontSize}px BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Sans-Serif`
    const textWidth = ctx.measureText(label).width
    const bgSize: [number, number] = [textWidth, fontSize] as const

    ctx.fillStyle = this._params.bgColor
    ctx.fillRect(node.x - bgSize[0] / 2, node.y - bgSize[1] / 2, bgSize[0], bgSize[1])

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = this.getNodeColor(node.base)
    ctx.fillText(label, node.x, node.y)

    node.__bgDimensions = bgSize
  }
  private nodePointerArea(node: NodeObject, color: string, ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = color
    const backgroundDimensions = node.__bgDimensions
    backgroundDimensions &&
      ctx.fillRect(
        node.x - backgroundDimensions[0] / 2,
        node.y - backgroundDimensions[1] / 2,
        ...backgroundDimensions,
      )
  }
  private onNodeValuesUpdate(source: CommonInternal) {
    eachDependency(source, (dep, type) => {
      if (type === 'child' && isStatxFn(dep)) {
        this.emitParticleIfLink(source, dep)
      }
    })
  }
  private onNodesUpdate() {
    //forceGraph.pauseAnimation()
    // TODO мутировать начальный объект, а не создоватиь новый
    // Добавлять новые ноды
    // удалять старые ноды
    // удалять старые связи
    // добавлять новые связи
    // на добавление новый данных вызывать emitParticle с нахождением нужной связи
    // const data = this.data().nodes.forEach((item) => {
    //   if (!this._data.nodes.find((node) => node.id === item.id)) {
    //     this._data.nodes.push(item)
    //   }
    // })
    //console.log(this._data.nodes)
    // forceGraph.graphData(this._data)
  }
  private updateProps({arrowSize, speed, linkColor, nodeSize, bgColor, particleColor}: GraphParametrs) {
    this.graph.linkDirectionalArrowLength(arrowSize)
    this.graph.linkDirectionalParticleSpeed(speed / 1000)
    this.graph.linkDirectionalParticleColor(() => particleColor)
    this.graph.linkColor(() => linkColor)
    this.graph.backgroundColor(bgColor)
    this.graph.nodeRelSize(nodeSize)
  }
  private data(): GraphData {
    const data = this.getStates()
    return {
      nodes: this.getNodes(data),
      links: this.getLinks(data),
    }
  }
  private getStates(): Array<CommonInternal> {
    return nodesMap
      .getNodes()
      .map((item) => item.deref())
      .filter((node) => {
        if (!node) {
          return false
        }
        if (!this.options.showAsyncSubStates) {
          if ('asyncDep' in node) {
            return false
          }
        }
        return true
      }) as Array<CommonInternal>
  }

  private getLinks(data: Array<CommonInternal>): Array<LinkObject> {
    const res: Array<LinkObject> = []

    data.forEach((node) => {
      console.log('>', node.name, {node})
      eachDependency(node, (dep, type) => {
        if (type === 'child' && isStatxFn(dep)) {
          res.push({source: node.id, target: dep.id})
        }
      })
      node.customDeps?.forEach((item) => {
        res.push({target: node.id, source: item.id})
      })
    })

    return res
  }

  private getNodes(data: Array<CommonInternal>): Array<NodeObject> {
    return data.map((item) => {
      const v: NodeObject = {id: item?.id ?? 0, base: item} as any
      return v
    })
  }

  private getNodeColor(base: CommonInternal) {
    //@ts-ignore
    return this._params.nodeColors[base.type] as any
  }

  replaceOptions(value: Partial<typeof this.options>) {
    this.options = {...this.options, ...value}
    this._data = this.data()
    console.log(this.options)
    this.graph.graphData(this._data)
  }
}
