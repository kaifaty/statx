/* eslint-disable @typescript-eslint/no-explicit-any */
import {stateTypes} from '@statx/core'
import {throttle} from '@statx/utils'
import {XElement, html, css} from '@statx/element'
import {from, mix} from 'better-color-tools'
import {GraphParametrs, InitGrap} from '../force-graph'
import {ViewNode} from './node-element'

export class DebugElement extends XElement {
  static define() {
    if (!customElements.get('debug-element')) {
      customElements.define('debug-element', this)
    }
    ViewNode.define()
    document.body.appendChild(document.createElement('debug-element'))
    window.addEventListener('message', (ev) => {
      console.log(ev)
    })
  }
  static styles = css`
    :host {
      display: grid;
      grid-template-columns: min-content auto;
      font-size: 12px;
      position: relative;
      width: 100dvw;
      height: 100dvh;
      font-family:
        BlinkMacSystemFont,
        Segoe UI,
        Roboto,
        Helvetica Neue,
        Sans-Serif;
    }

    table td {
      padding: 3px 10px;
    }
    view-node {
      height: 100%;
    }
    .graph-tooltip {
      position: absolute;
      z-index: 1;
      padding: 0;
      visibility: hidden;
    }
  `
  graphProps(): GraphParametrs {
    const base = from({l: 0.17, c: 0.1, h: 230})
    return {
      nodeSize: 5,
      arrowSize: 2,
      speed: 2,
      bgColor: base.rgb,
      linkColor: mix(base.rgb, [1, 1, 300]).rgb,
      particleColor: from({l: 0.6, c: 0.25, h: 10}).rgb,
      nodeColors: {
        [stateTypes.state]: 'Magenta',
        [stateTypes.async]: 'deepskyblue',
        [stateTypes.list]: 'OrangeRed',
        [stateTypes.computed]: 'chartreuse',
      },
    }
  }

  sidebarWidth = 360
  _graph!: InitGrap
  _node = ''
  updated(): void {
    if (!this._graph) {
      setTimeout(() => {
        this._graph = new InitGrap(this.shadowRoot!.getElementById('grahp')!, this.graphProps())
        this.resize()
      })
    }
  }

  resize = throttle(() => {
    this._graph?.graph.width(window.innerWidth - this.sidebarWidth)
  }, 30)

  private nodeUpdate = (e: CustomEvent<string>) => {
    this._node = e.detail
    this.requestUpdate()
  }
  connectedCallback(): void {
    super.connectedCallback()
    window.addEventListener('resize', this.resize as EventListener)
    window.addEventListener('nodeChange', this.nodeUpdate as EventListener)
  }
  disconnectedCallback(): void {
    super.disconnectedCallback()
    window.removeEventListener('nodeChange', this.nodeUpdate as EventListener)
    window.removeEventListener('resize', this.resize as EventListener)
  }

  render() {
    return html` <div id="grahp"></div>
      <view-node .stateName="${this._node}"></view-node>`
  }
}
