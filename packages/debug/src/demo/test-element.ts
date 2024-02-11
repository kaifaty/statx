/* eslint-disable @typescript-eslint/no-explicit-any */
import {XElement, css, html} from '@statx/element'
import {maxText, repos, userQuery} from './demo'

export class TestClass extends XElement {
  static styles = css`
    :host {
      display: block;
      padding: 10px;
    }
    div {
      padding: 10px;
      font-weight: bold;
    }
    table {
      font-size: 18px;
      td {
        padding: 5px 10px;
      }
    }
  `
  changeName(e: Event) {
    const v = (e.target as HTMLInputElement).value
    userQuery.set(v)
  }
  render() {
    const res = repos()?.map((item) => {
      return html`<tr>
        <td>${item.name}</td>
        <td>${item.pushed_at}</td>
      </tr>`
    })
    return html`
      Status: ${repos.status()}
      <input .value="${userQuery()}" @input="${this.changeName}" />
      <span>&nbsp;${repos.isPending() ? '...loading' : ''}</span>
      ${maxText}
      <table>
        ${res}
      </table>
    `
  }
}
