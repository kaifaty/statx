/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CommonInternal,
  getNodeType,
  isState,
  isComputed,
  isAsyncComputed,
  isStatxFn,
  isList,
} from '@statx/core'
import {XElement, html, css} from '@statx/element'

const formatTime = (ts: number) => {
  return new Date(ts).toLocaleString().replace('T', ' ')
}
const getLastUpdate = (node: CommonInternal) => {
  if (!node?._history) {
    return '-'
  }
  return formatTime(node._history[node._historyCursor].ts)
}

export class ViewNode extends XElement {
  static define() {
    if (!customElements.get('view-node')) {
      customElements.define('view-node', this)
    }
  }
  static styles = css`
    :host {
      z-index: 1;
      padding: 0;
      border-radius: 1px;
      display: block;
      color: hsl(230, 31%, 31%);
      background-color: hsl(230, 28%, 98%);
      padding: 5px 10px;
      font-size: 14px;
    }
    h3 {
      text-align: center;
    }
    table {
      width: 100%;
      td {
        padding: 3px 10px;
      }
    }
    .selected {
      font-weight: bold;
    }
    .wrapper {
      display: grid;
      grid-template-columns: min-content auto;
      white-space: nowrap;
      gap: 5px 20px;
      .row {
        display: grid;
        grid-template-columns: subgrid;
        grid-column: 1 / 3;
        div:nth-child(2n) {
          white-space: normal;
        }
        div.no-wrap {
          white-space: nowrap;
        }
      }
      .row:nth-child(2n) {
        background-color: hsl(230, 28%, 90%);
      }
    }
  `
  set stateName(value: string) {
    window.getStateByName(value).then(({res}) => {
      this.node = res
      if (res) {
        this.requestUpdate()
      }
    })
  }

  node?: CommonInternal

  reqUpdate = () => this.requestUpdate()
  unsub?: () => void
  connectedCallback(): void {
    super.connectedCallback()
    this.unsub = window.events.onUpdate(this.reqUpdate)
  }
  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.unsub?.()
  }

  renderValue(value: unknown): string {
    if (Array.isArray(value)) {
      return value.map((item) => this.renderValue(item)).join(', ')
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }
  renderStateTable(node: CommonInternal) {
    return html` <tr>
        <th>At</th>
        <th>Value</th>
      </tr>
      ${node._history?.map((item, i) => {
        return html`<tr class="${i === node._historyCursor ? 'selected' : ''}">
          <td>${formatTime(item.ts)}</td>
          <td>${this.renderValue(item.value)}</td>
        </tr>`
      })}`
  }
  renderComputedTable(node: CommonInternal) {
    return html`
      <tr>
        <th>At</th>
        <th>Changer</th>
        <th>Value</th>
      </tr>
      ${node._history?.map((item, i) => {
        return html`<tr class="${i === node._historyCursor ? 'selected' : ''}">
          <td>${formatTime(item.ts)}</td>
          <td>${item.changer?.map((v) => html`${v.name}<br />`)}</td>
          <td>${this.renderValue(item.value)}</td>
        </tr>`
      })}
    `
  }
  renderTable(node: CommonInternal) {
    if (isState(node) || isList(node)) {
      return this.renderStateTable(node)
    }
    if (isComputed(node) || isAsyncComputed(node)) {
      return this.renderComputedTable(node)
    }
  }
  renderHistory(node?: CommonInternal) {
    if (!node?._history) {
      return 'No history data'
    }
    return html`<table class="popup">
      ${this.renderTable(node)}
    </table>`
  }

  renderCard(node: CommonInternal) {
    return html`
      <div class="wrapper">
        <div class="row">
          <div>Updated</div>
          <div class="no-wrap">${getLastUpdate(node)}</div>
        </div>
        <div class="row">
          <div>Type</div>
          <div>${getNodeType(node)}</div>
        </div>
        <div class="row">
          <div>Name</div>
          <div>${node.name}</div>
        </div>
        <div class="row">
          <div>Current value</div>
          <div>${node.currentValue}</div>
        </div>
        <div class="row">
          <div>Prev value</div>
          <div>${node.prevValue}</div>
        </div>
        <div class="row">
          <div>Listeners</div>
          <div>
            ${[...node._listeners.values()]
              .map((listener) => {
                if (isStatxFn(listener)) {
                  return listener.name
                }
                return (listener as any).subscriber ?? 'unknown'
              })
              .join(', ')}
          </div>
        </div>
      </div>
      ${this.renderHistory(node)}
    `
  }
  render() {
    const node = this.node
    if (!node) {
      return html`<h3>No node selected</h3>`
    }
    return this.renderCard(node)
  }
}
