import {css} from '../styles'
import type {State} from '@statx/core'
import {list, state} from '@statx/core'
import {html} from '../html/html'
import type {ObservedAttributeMap} from '../types'
import {StatxHTML} from '../StatxHTML'

const createArray = (length: number) => {
  return Array.from({length}).map((_, i) => {
    return i
  })
}
const arr = list<number[]>(createArray(1), {name: 'Array_1'})

class StatxTest extends StatxHTML {
  static attributes: ObservedAttributeMap = {
    type: {
      reflect: true,
      converter: {
        fromAttribute: (value) => {
          return Number(value)
        },
        toAttribute: (value: number) => {
          return String(value)
        },
      },
    },
  }
  static styles = css`
    :host {
      --hue: 300;
      font-family: Helvetica, Arial;
    }
    button {
      font-weight: bold;
      padding: 3px 10px;
      color: magenta;
      background-color: hsl(330, 80%, 20%);
      border: 1px solid magenta;
      cursor: pointer;
    }
    span {
      display: flex;
      contain: content;
      width: 100px;
      align-items: center;
    }
    input {
      height: 100%;
      color: #000;
    }
    ul {
      contain: content;
    }
    li {
      box-sizing: border-box;
      padding: 5px;
      ::marker {
        content: '';
      }
      input {
        font-weight: bold;
        font-size: 18px;
        color: hsl(var(--hue), 80%, 40%);
      }
    }
    label {
      font-size: 16px;
      padding-right: 10px;
    }
    .row {
      height: 40px;
      contain: content;
      display: flex;
      gap: 3px;
      input,
      label,
      button {
        display: flex;
        height: 30px;
        box-sizing: border-box;
        align-items: center;
      }
    }
  `
  count = state(1)

  handleSwap(id1: number, id2: number) {
    const v1 = arr.at(id1)?.peek()
    const v2 = arr.at(id2)?.peek()

    if (v1 !== undefined && v2 !== undefined) {
      arr.at(id2)?.set(v1)
      arr.at(id1)?.set(v2)
    }
  }

  handleMoveUp(item: State<number>) {
    const index = arr.indexOf(item)
    this.handleSwap(index, index - 1)
  }

  handleMoveDown(item: State<number>) {
    const index = arr.indexOf(item)
    this.handleSwap(index, index + 1)
  }

  handleAdd() {
    arr.set(createArray(this.count()))
  }

  handleDelete(item: State<number>) {
    const index = arr.indexOf(item)
    arr.splice(index, 1)
  }

  handlerCount(e: Event) {
    const newCount = (e.target as HTMLInputElement).value
    this.count.set(Number(newCount))
  }

  handlerInput(e: Event, item: State<number>) {
    const newCount = (e.target as HTMLInputElement).value
    item.set(Number(newCount))
  }

  render() {
    return html`
      <div class="row">
        <label for="input">List from length: </label
        ><input id="input" @change="${this.handlerCount}" .value="${this.count}" />
        <button @click=${this.handleAdd}>Set</button>
        <button @click="${() => arr.set([])}">🗑️</button>
      </div>
      <ul>
        ${arr.map((item) => {
          return html`<li class="row">
            <input .value="${item}" @input="${(e) => this.handlerInput(e, item)}" />
            <button @click="${() => this.handleMoveUp(item)}">👆</button>
            <button @click="${() => this.handleMoveDown(item)}">👇</button>
            <button @click="${() => this.handleDelete(item)}">🗑️</button>
          </li>`
        })}
      </ul>
    `
  }
}

customElements.define('statx-temp', StatxTest)
