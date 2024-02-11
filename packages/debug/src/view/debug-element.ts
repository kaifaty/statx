/* eslint-disable @typescript-eslint/no-explicit-any */
import {throttle} from '@statx/utils'
import {XElement, html, css} from '@statx/element'
import type {GraphParametrs} from '../force-graph'
import {InitGraph} from '../force-graph'
import {ViewNode} from './node-element'
import {Colors} from './colors'

const sidebarWidth = 360

export class DebugElement extends XElement {
  static define() {
    if (!customElements.get('debug-element')) {
      customElements.define('debug-element', this)
    }
    ViewNode.define()
    document.body.appendChild(document.createElement('debug-element'))
  }
  static styles = css`
    :host {
      display: grid;
      grid-template-columns: auto auto;
      font-size: 12px;
      position: relative;
      width: 100dvw;
      height: 100dvh;
      background-color: var(--bg-color);
      color: #fff;
      font-family:
        BlinkMacSystemFont,
        Segoe UI,
        Roboto,
        Helvetica Neue,
        Sans-Serif;
    }
    nav {
      grid-column: 1/3;
      background-color: #000;
      padding: 8px 15px;
    }

    table td {
      padding: 3px 10px;
    }
    view-node {
      height: 100%;
      width: ${sidebarWidth.toString()}px;
    }
    .graph-tooltip {
      position: absolute;
      z-index: 1;
      padding: 0;
      visibility: hidden;
    }
  `
  colors = new Colors()
  graphProps(): GraphParametrs {
    return {
      nodeSize: 5,
      arrowSize: 2,
      speed: 2,
      bgColor: this.colors.background,
      linkColor: this.colors.link,
      particleColor: this.colors.particle,
      nodeColors: this.colors.nodeColors,
    }
  }

  _graph!: InitGraph
  _node = ''
  resize = throttle(() => {
    this._graph?.graph.width(window.innerWidth - sidebarWidth)
  }, 30)

  private nodeUpdate = (e: CustomEvent<string>) => {
    this._node = e.detail
    this.requestUpdate()
  }
  connectedCallback(): void {
    super.connectedCallback()
    window.addEventListener('resize', this.resize as EventListener)
    window.addEventListener('nodeChange', this.nodeUpdate as EventListener)
    this.style.setProperty('--bg-color', this.graphProps().bgColor)
    setTimeout(() => {
      this._graph = new InitGraph(this.shadowRoot!.getElementById('grahp')!, this.graphProps())
      this.colors.setGraph(this._graph.graph)
      this.resize()
    })
  }
  disconnectedCallback(): void {
    super.disconnectedCallback()
    window.removeEventListener('nodeChange', this.nodeUpdate as EventListener)
    window.removeEventListener('resize', this.resize as EventListener)
  }
  toggleAsyncSubState = () => {
    this._graph.replaceOptions({
      showAsyncSubStates: !this._graph.options.showAsyncSubStates,
    })
  }

  render() {
    return html` <nav>
        <label
          >ToggleAsyncSubStates
          <input
            .checked="${this._graph?.options.showAsyncSubStates}"
            type="checkbox"
            @click="${this.toggleAsyncSubState}"
        /></label>
      </nav>
      <view-node id="view" .stateName="${this._node}" .colors="${this.colors}"></view-node>
      <div id="grahp"></div>`
  }
}
