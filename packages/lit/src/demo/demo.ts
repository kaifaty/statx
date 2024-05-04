import {html} from 'lit'
import {state, computed} from '@statx/core'
import {XLitElement} from '../index.js'

const v1 = state(1, {name: 'timer'})
const v2 = computed(() => {
  if (v1() < 10) {
    return html`<b>just now</b>`
  }
  return html`<i>${v1()} sec ago</i>`
})

setInterval(() => {
  v1.set(v1() + 1)
}, 100)

export class StatebleComponent extends XLitElement {
  protected render(): unknown {
    console.log('render 1')
    return html`StatebleComponent > Timer = ${v1()}, ${v2()}`
  }
}

customElements.define('test-component', StatebleComponent)
