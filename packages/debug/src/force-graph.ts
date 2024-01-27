/* eslint-disable @typescript-eslint/no-explicit-any */
import {isComputed, isAsyncComputed, CommonInternal} from '@statx/core'

import ForceGraph, {GraphData, ForceGraphInstance, LinkObject} from 'force-graph'
import {Link, NodeObject} from './types'

const getStatesMap = window.getStatesMap
export type GraphParametrs = {
  nodeSize: number
  arrowSize: number
  speed: number
  particleColor: string
  linkColor: string
  bgColor: string
  nodeColors: {
    0: string
    1: string
    2: string
    3: string
  }
}
export class InitGrap {
  private _data: GraphData
  graph: ForceGraphInstance
  private _params: GraphParametrs
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

    window.events.onUpdateValue((source) => {
      this.onNodeValuesUpdate(source)
    })
    window.events.onUpdate(() => {
      this.onNodesUpdate()
    })
    this.updateProps(params)
  }
  private findLink(source: CommonInternal, target: CommonInternal) {
    const links = this._data.links as Link[]
    const link = links.find((item) => {
      return item.source.id === source._id && item.target.id === target._id
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
    const bckgDimensions = node.__bgDimensions
    bckgDimensions &&
      ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions)
  }
  private onNodeValuesUpdate(source: CommonInternal) {
    if (source._history === undefined || source._historyCursor === undefined) {
      return
    }
    const history = source._history[source._historyCursor]
    const reason = history.reason

    if (reason === 'outside') {
      const stack = [source]

      while (stack.length) {
        const src = stack.pop()
        src?._listeners.forEach((target) => {
          if (isComputed(target)) {
            this.findLink(src, target)
            stack.push(target)
          } else if (isAsyncComputed(target)) {
            this.findLink(src, target)
            if (target.currentValue !== target.prevValue) {
              stack.push(target)
            }
          }
        })
      }
    }
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
    return [...getStatesMap().values()].map((item) => item.deref()).filter(Boolean) as Array<CommonInternal>
  }

  private getLinks(data: Array<CommonInternal>): Array<LinkObject> {
    const res: Array<LinkObject> = []

    data.forEach((state) => {
      state._listeners.forEach((listener) => {
        if (isComputed(listener)) {
          res.push({source: state._id, target: listener._id})
        }
      })
      state.customDeps?.forEach((item) => {
        res.push({target: state._id, source: item._id})
      })
    })

    return res
  }

  private getNodes(data: Array<CommonInternal>): Array<NodeObject> {
    return data.map((item) => {
      const v: NodeObject = {id: item?._id ?? 0, base: item} as any
      return v
    })
  }

  private getNodeColor(base: CommonInternal) {
    //@ts-ignore
    return this._params.nodeColors[base._type] as any
  }
}
