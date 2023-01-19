import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators/custom-element.js'
import { state, computed } from '@statx/core'
import { statableLit } from '../src/index.js'

const v1 = state(1, { name: 'timer' })

const s3 = computed(() => s1() + s2() + v1(), { name: 's3' })
const s2 = computed(() => s1() - 5, { name: 's2' })
const s1 = computed(() => v1() * 10, { name: 's1' })

setTimeout(() => {
  for (let i = 0; i < 1000; i++) {
    v1.set(i)
  }
})

s3.subscribe((v) => {
  console.log('client v3', v, s3())
})

const st = () => {
  const data = {
    test: 123,
  }
  const f = function () {
    console.log('1234', data.test)
  }
  f.data = data
  return f
}

const array = [] //  state(Array.from({'length': 10}, (_, i) => i * 10), )

const testFunc = st()

testFunc()

@customElement('test-component')
export class TestComponent extends statableLit(LitElement) {
  protected render(): unknown {
    return html`Timer = ${v1()}<br />
      <style>
        tr,
        td {
          contain: content;
        }
      </style>
      <table>
        ${array.map((item) => {
          return html`<tr>
            <td>${item}</td>
            <td>${item}</td>
            <td>${item}</td>
          </tr>`
        })}
      </table> `
  }
}
