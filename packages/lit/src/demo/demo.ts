import {LitElement, html as coreHtml, render} from 'lit'
import {state, computed} from '@statx/core'
import {statableLit, watch, html} from '../index.js'

const v1 = state(1, {name: 'timer'})
const v2 = computed(() => {
  if (v1() < 10) {
    return html`<b>just now</b>`
  }
  return html`<i>${v1()} sec ago</i>`
})

const list = state<string[]>([])

const s2 = computed(() => s1() - 5, {name: 's2'})
const s1 = computed(() => v1() * 10, {name: 's1'})

setInterval(() => {
  v1.set(v1() + 1)
  list.set([...list(), 'text ' + 1])
}, 500)

export class StatebleComponent extends statableLit(LitElement) {
  protected render(): unknown {
    console.log('render 1')
    return coreHtml`StatebleComponent > Timer = ${v1()}`
  }
}

export class SimpleComponent extends LitElement {
  protected render(): unknown {
    console.log('render 2')
    return coreHtml`SimpleComponent withoutWatcnh directive > Timer = ${watch(v1)} `
  }
}

export class WatchDirective extends LitElement {
  s3 = computed(() => html`<i>:: ${v2} ${s1() + s2() + v1()}</i>`, {name: 's3'})

  protected render(): unknown {
    console.log('render 3')
    return html`WatchDirective: ${v1} ${this.s3}`
  }
}
const s3 = computed(() => html`v1 = ${v1}, <i>:: ${v2} ${s1() + s2() + v1()}</i>`, {name: 's3'})

const renderTimer = computed(() => {
  if (v1() > 5) {
    return 'pipi'
  }
  return html`
    <p>WithoutComponent > Timer = ${s3}</p>
    <ul>
      ${list().map((item) => {
        return html` <li>${item}</li>`
      })}
    </ul>
  `
})

render(html`${renderTimer}`, document.querySelector('#test'))

customElements.define('test-component', StatebleComponent)
customElements.define('test-html', WatchDirective)
customElements.define('test-watch', SimpleComponent)
