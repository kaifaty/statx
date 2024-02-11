/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CommonInternal, DependencyType, ListenerInternal} from '@statx/core'
import {getNodeType, eachDependency} from '@statx/core'
import {XElement, css} from '@statx/element'
import type {TemplateResult} from 'lit/html.js'
import {html, render} from 'lit/html.js'

import {JsonViewer} from '@alenaksu/json-viewer/dist/JsonViewer.js'
import type {Colors} from './colors'

customElements.define('json-viewer', JsonViewer)

const formatTime = (ts: number) => {
  return new Date(ts).toLocaleString().replace('T', ' ')
}

const getLastUpdate = (node: CommonInternal) => {
  if (!node?.history) {
    return '-'
  }
  return formatTime(node.history[node.historyCursor].ts)
}

const isTemplateResult = (value: unknown): value is TemplateResult => {
  return Boolean(typeof value === 'object' && value && '_$litType$' in value)
}

const renderDialog = (value: unknown, colors: Colors) => {
  const dialog = document.createElement('dialog')
  dialog.open = true
  dialog.style.setProperty('--background-color', colors.dialogBackground)
  dialog.style.setProperty('color', colors.dialogColor)

  render(
    html`
      <section>${value}</section>
      <button>X</button>
    `,
    dialog,
  )
  dialog.querySelector('button')?.addEventListener('click', () => {
    dialog.close()
    dialog.remove()
  })
  render(dialog, document.body)
}
const renderDialogJSON = (value: unknown, colors: Colors) => {
  const viewer = document.createElement('json-viewer')
  viewer.style.setProperty('--background-color', colors.dialogBackground)
  //@ts-ignore
  viewer.data = value
  return renderDialog(viewer, colors)
}

class Deps {
  private static createMapper =
    <T extends CommonInternal | ListenerInternal>(type: DependencyType) =>
    (node: CommonInternal): Array<T> => {
      const res: CommonInternal[] = []
      eachDependency(node, (item, _type) => {
        if (_type === type) {
          res.push(item as CommonInternal)
        }
      })
      return res as Array<T>
    }
  static getChildren = this.createMapper<CommonInternal>('child')
  static getParents = this.createMapper<CommonInternal>('parent')
  static getListeners = this.createMapper<ListenerInternal>('listener')
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
      font-size: 16px;
      border-right: 1px solid var(--node-background-color);
    }
    h3 {
      text-align: center;
    }
    header {
      padding: 12px 20px;
      width: 100%;
      box-sizing: border-box;
      background-color: var(--node-background-color);
      color: var(--node-color);
      .row-between {
        display: flex;
        justify-content: space-between;
      }
      .type {
        font-weight: bold;
        text-transform: capitalize;
      }
      h2 {
        margin: 7px 0 0 0;
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
      padding: 20px;
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
    }
    table {
      padding: 20px 10px;
      font-size: 14px;
      width: 100%;
      td {
        padding: 3px 5px;
      }
      th {
        padding: 3px 5px;
        text-align: left;
      }
    }
    .no-data {
      display: flex;
      justify-content: center;
      padding: 10px;
    }
  `
  set stateName(value: string) {
    window.nodesMap.getNodeByName(value).then(({res}) => {
      this.node = res
      if (res) {
        this.updateColors(res)
        this.requestUpdate()
      }
    })
  }

  node?: CommonInternal
  colors!: Colors

  private updateColors(node: CommonInternal) {
    this.style.setProperty('--node-background-color', this.colors.getNodeColorBackground(node.type))
    this.style.setProperty('--node-color', this.colors.getNodeColor(node.type))
  }
  reqUpdate = (node: CommonInternal) => {
    if (this.node?.type === node.type) {
      this.requestUpdate()
    }
  }
  unsub?: () => void
  connectedCallback(): void {
    super.connectedCallback()
    this.unsub = window.events.on('ValueUpdate', this.reqUpdate)
  }
  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.unsub?.()
  }

  renderValue(value: unknown): string | TemplateResult {
    if (isTemplateResult(value)) {
      return html`<button @click="${() => renderDialog(value, this.colors)}">View Template</button>`
    }
    if (typeof value === 'object' && value) {
      if (Array.isArray(value) && value.length === 0) {
        return '[]'
      }
      return html`<button @click="${() => renderDialogJSON(value, this.colors)}">View JSON</button>`
    }
    return String(value)
  }

  renderTable(node: CommonInternal) {
    return html` <tr>
        <th>Time</th>
        <th>Reason</th>
        <th>Value</th>
      </tr>
      ${node.history?.map((item, i) => {
        return html`<tr class="${i === node.historyCursor ? 'selected' : ''}">
          <td>${formatTime(item.ts)}</td>
          <td>${typeof item.reason === 'string' ? item.reason : item.reason?.name}</td>
          <td>${this.renderValue(item.value)}</td>
        </tr>`
      })}`
  }

  renderHistory(node?: CommonInternal) {
    if (!node?.history) {
      return html`<div class="no-data">No history data</div>`
    }
    return html`<table class="popup">
      ${this.renderTable(node)}
    </table>`
  }

  renderCard(node: CommonInternal) {
    return html`
      <header>
        <div class="row-between">
          <div class="type">${getNodeType(node)}</div>
          <div class="no-wrap">${getLastUpdate(node)}</div>
        </div>
        <h2>${node.name}</h2>
      </header>
      <div class="wrapper">
        <div class="row">
          <div>Listeners</div>
          <div>
            ${Deps.getListeners(node)
              .map((node) => {
                return node.subscriber ?? 'unknown'
              })
              .join(', ')}
          </div>
        </div>
        <div class="row">
          <div>Parents</div>
          <div>
            ${Deps.getParents(node)
              .map((node) => node.name)
              .join(', ')}
          </div>
        </div>
        <div class="row">
          <div>Children</div>
          <div>
            ${Deps.getChildren(node)
              .map((node) => node.name)
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
