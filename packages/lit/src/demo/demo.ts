import {LitElement, html as coreHtml} from 'lit'
import {state, computed} from '@statx/core'
import {statableLit, watch, html} from '../index.js'

const v1 = state(1, {name: 'timer'})
const v2 = computed(() => {
  if (v1() < 10) {
    return html`<b>just now</b>`
  }
  return html`<i>${v1()} sec ago</i>`
})

const s2 = computed(() => s1() - 5, {name: 's2'})
const s1 = computed(() => v1() * 10, {name: 's1'})

setInterval(() => {
  v1.set(v1() + 1)
}, 500)

export class TestComponent extends statableLit(LitElement) {
  protected render(): unknown {
    console.log('render 1')
    return coreHtml`Timer = ${v1()}`
  }
}

export class TestWatch extends LitElement {
  protected render(): unknown {
    console.log('render 2')
    return coreHtml`Timer = ${watch(v1)} `
  }
}

export class TestHtml extends LitElement {
  s3 = computed(() => html`<i>:: ${v2} ${s1() + s2() + v1()}</i>`, {name: 's3'})

  protected render(): unknown {
    console.log('render 3')
    return html`Timer = ${v1} ${this.s3}`
  }
}

customElements.define('test-component', TestComponent)
customElements.define('test-html', TestHtml)
customElements.define('test-watch', TestWatch)
